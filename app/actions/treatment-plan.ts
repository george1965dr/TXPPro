"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CONDITIONS, type ConditionId } from "@/lib/dental/conditions";
import { bridgeIdFromChartKey } from "@/lib/dental/chart-key";
import {
  adaCodeForBridgePontic,
  adaCodeForBridgeRetainer,
  adaCodeForFilling,
  adaCodeForInlayOnlay,
  adaCodeForOverlay,
  adaCodeForVeneer,
  adaCodeForWholeTooth,
} from "@/lib/dental/procedure-mapping";
import {
  parseToothNumber,
  SURFACE_BY_ABBREVIATION,
  surfaceComboLabel,
  toothPosition,
  type BridgeRangeTooth,
} from "@/lib/dental/tooth-geometry";
import { createBridge, removeBridge, setToothCondition, setToothOverlay } from "@/app/actions/chart";
import type { BridgeType, OverlayType, Procedure, ToothSurface, WholeToothCondition } from "@/lib/types";

/**
 * Adds a procedure to the patient's treatment plan, creating the plan on
 * first use (a patient has no treatment_plans row until something is added
 * to it). Fee is snapshotted from the procedure's current published price
 * at the moment of insert - it never tracks later edits to that price.
 * For tooth-less items only (cleanings, exams); tooth-anchored clinical
 * procedures go through addKanbanProcedure instead.
 */
export async function addProcedureToPlan(
  patientId: string,
  treatmentPlanId: string | null,
  procedureId: string,
  toothNumber?: number,
) {
  const supabase = await createClient();

  let planId = treatmentPlanId;
  if (!planId) {
    const { data: plan, error: planError } = await supabase
      .from("treatment_plans")
      .insert({ patient_id: patientId, total_fee: 0 })
      .select("id")
      .single();
    if (planError) throw new Error(planError.message);
    planId = plan.id;
  }

  const { data: procedure, error: procedureError } = await supabase
    .from("procedures")
    .select("fee")
    .eq("id", procedureId)
    .single();
  if (procedureError) throw new Error(procedureError.message);

  const { data: item, error } = await supabase
    .from("treatment_plan_items")
    .insert({
      treatment_plan_id: planId,
      procedure_id: procedureId,
      quantity: 1,
      fee: procedure.fee,
      ...(toothNumber != null ? { tooth_numbers: [String(toothNumber)] } : {}),
    })
    .select("*, procedure:procedures(*)")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/patients/${patientId}`);
  return { planId, item: item as { id: string; procedure: Procedure } };
}

/**
 * Schedules an item into a visit, moves it between visits, or (when
 * appointmentNumber is null) unschedules it. One row per item at a time -
 * unlike the old app, this never deletes-and-reinserts the whole sequence.
 */
export async function scheduleItem(
  patientId: string,
  treatmentPlanId: string,
  itemId: string,
  appointmentNumber: number | null,
) {
  const supabase = await createClient();

  if (appointmentNumber === null) {
    const { error } = await supabase
      .from("sequenced_treatment_plan_items")
      .delete()
      .eq("treatment_plan_item_id", itemId);
    if (error) throw new Error(error.message);
    revalidatePath(`/patients/${patientId}`);
    return;
  }

  const { data: existingSeqPlan } = await supabase
    .from("sequenced_treatment_plans")
    .select("id")
    .eq("treatment_plan_id", treatmentPlanId)
    .single();

  let sequencedPlanId = existingSeqPlan?.id as string | undefined;
  if (!sequencedPlanId) {
    const { data: newSeqPlan, error: seqError } = await supabase
      .from("sequenced_treatment_plans")
      .insert({ treatment_plan_id: treatmentPlanId })
      .select("id")
      .single();
    if (seqError) throw new Error(seqError.message);
    sequencedPlanId = newSeqPlan.id;
  }

  const { error } = await supabase.from("sequenced_treatment_plan_items").upsert(
    {
      sequenced_treatment_plan_id: sequencedPlanId,
      treatment_plan_item_id: itemId,
      appointment_number: appointmentNumber,
    },
    { onConflict: "treatment_plan_item_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function updatePlanItemFee(patientId: string, itemId: string, fee: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("treatment_plan_items").update({ fee }).eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export type KanbanAddInput =
  | { kind: "surface"; conditionId: ConditionId; toothNumber: number; surfaces: ToothSurface[] }
  | { kind: "whole"; conditionId: ConditionId; toothNumber: number }
  | { kind: "overlay"; conditionId: ConditionId; toothNumber: number }
  | { kind: "bridge"; conditionId: ConditionId; teeth: BridgeRangeTooth[] };

export interface KanbanAddResultItem {
  id: string;
  procedureId: string;
  adaCode: string;
  description: string;
  fee: number;
  toothNumber: number | null;
  surfaces: string[];
  chartKey: string;
}

interface ResolvedLineItem {
  adaCode: string;
  chartKey: string;
  toothNumber: number;
  surfaces: string[];
}

function adaCodeForSurfaceCondition(conditionId: ConditionId, surfaceCount: number): string {
  switch (conditionId) {
    case "filling":
      return adaCodeForFilling(surfaceCount);
    case "veneer":
      return adaCodeForVeneer();
    case "inlay_onlay":
      return adaCodeForInlayOnlay(surfaceCount);
    default:
      throw new Error(`"${conditionId}" is not a surface condition.`);
  }
}

/**
 * Draws the proposed-layer chart graphic for this addition (via the same
 * chart.ts actions the odontogram's own paint handlers use for the
 * existing layer) and resolves the ADA code(s) it bills under. One entry
 * per tooth for a bridge, exactly one otherwise.
 */
async function drawProposedGraphic(patientId: string, input: KanbanAddInput): Promise<ResolvedLineItem[]> {
  switch (input.kind) {
    case "surface": {
      for (const surface of input.surfaces) {
        await setToothCondition(patientId, input.toothNumber, surface, "proposed", input.conditionId);
      }
      const combo = surfaceComboLabel(input.surfaces, input.toothNumber);
      return [
        {
          adaCode: adaCodeForSurfaceCondition(input.conditionId, input.surfaces.length),
          chartKey: `${input.toothNumber}-${input.conditionId}`,
          toothNumber: input.toothNumber,
          surfaces: combo.split(""),
        },
      ];
    }
    case "whole": {
      await setToothCondition(patientId, input.toothNumber, "whole", "proposed", input.conditionId);
      return [
        {
          adaCode: adaCodeForWholeTooth(input.conditionId as WholeToothCondition),
          chartKey: `${input.toothNumber}-${input.conditionId}`,
          toothNumber: input.toothNumber,
          surfaces: [],
        },
      ];
    }
    case "overlay": {
      await setToothOverlay(patientId, input.toothNumber, "proposed", input.conditionId as OverlayType, true);
      const adaCode = adaCodeForOverlay(input.conditionId as OverlayType, toothPosition(input.toothNumber));
      if (!adaCode) throw new Error(`"${input.conditionId}" has no billable code.`);
      return [
        {
          adaCode,
          chartKey: `${input.toothNumber}-${input.conditionId}`,
          toothNumber: input.toothNumber,
          surfaces: [],
        },
      ];
    }
    case "bridge": {
      const bridgeType: BridgeType = input.conditionId === "implant_bridge" ? "implant" : "tooth";
      const { bridgeId } = await createBridge(patientId, "proposed", bridgeType, input.teeth);
      return input.teeth.map((t) => ({
        adaCode: t.role === "abutment" ? adaCodeForBridgeRetainer(bridgeType) : adaCodeForBridgePontic(),
        chartKey: `bridge-${bridgeId}-${t.toothNumber}`,
        toothNumber: t.toothNumber,
        surfaces: [],
      }));
    }
  }
}

/**
 * The authoritative way to propose treatment: draws the proposed-layer
 * chart graphic and creates the treatment_plan_item(s) for it in one call,
 * each with its fee frozen at today's published price. This is the only
 * path that writes to the proposed layer - the odontogram no longer paints
 * it directly, so the chart and the plan can't drift apart.
 */
export async function addKanbanProcedure(
  patientId: string,
  treatmentPlanId: string | null,
  input: KanbanAddInput,
): Promise<{ planId: string; items: KanbanAddResultItem[] }> {
  const supabase = await createClient();

  const conditionDef = CONDITIONS.find((c) => c.id === input.conditionId);
  if (!conditionDef || conditionDef.existingOnly) {
    throw new Error(`"${input.conditionId}" can only be charted as existing, not proposed.`);
  }

  let planId = treatmentPlanId;
  if (!planId) {
    const { data: plan, error: planError } = await supabase
      .from("treatment_plans")
      .insert({ patient_id: patientId, total_fee: 0 })
      .select("id")
      .single();
    if (planError) throw new Error(planError.message);
    planId = plan.id;
  }
  // Narrowed to non-null by the block above, but not held across the
  // `await` below - pin it to its own const so later uses stay typed.
  const resolvedPlanId = planId!;

  const resolved = await drawProposedGraphic(patientId, input);

  const adaCodes = [...new Set(resolved.map((r) => r.adaCode))];
  const { data: procedureRows, error: procError } = await supabase
    .from("procedures")
    .select("id, ada_code, description, fee")
    .in("ada_code", adaCodes);
  if (procError) throw new Error(procError.message);

  const procedureByCode = new Map((procedureRows ?? []).map((p) => [p.ada_code, p]));
  const missing = adaCodes.filter((code) => !procedureByCode.has(code));
  if (missing.length > 0) {
    throw new Error(`No published fee on file for ${missing.join(", ")} - add it to the procedure list first.`);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("treatment_plan_items")
    .insert(
      resolved.map((r) => {
        const procedure = procedureByCode.get(r.adaCode)!;
        return {
          treatment_plan_id: resolvedPlanId,
          procedure_id: procedure.id,
          quantity: 1,
          tooth_numbers: [String(r.toothNumber)],
          surfaces: r.surfaces,
          fee: procedure.fee,
          chart_key: r.chartKey,
        };
      }),
    )
    .select("id, procedure_id, tooth_numbers, surfaces, fee, chart_key");
  if (insertError) throw new Error(insertError.message);

  const procedureById = new Map((procedureRows ?? []).map((p) => [p.id, p]));
  const items: KanbanAddResultItem[] = (inserted ?? []).map((row) => {
    const procedure = procedureById.get(row.procedure_id)!;
    return {
      id: row.id,
      procedureId: row.procedure_id,
      adaCode: procedure.ada_code,
      description: procedure.description,
      fee: row.fee,
      toothNumber: parseToothNumber(row.tooth_numbers?.[0]),
      surfaces: row.surfaces ?? [],
      chartKey: row.chart_key as string,
    };
  });

  revalidatePath(`/patients/${patientId}`);
  return { planId: resolvedPlanId, items };
}

/** Erases the proposed-layer graphic a single-tooth kanban item drew, inferred from its chart_key. */
async function eraseProposedGraphic(
  patientId: string,
  chartKey: string,
  surfaceAbbreviations: string[],
) {
  const dashIndex = chartKey.indexOf("-");
  const toothNumber = Number(chartKey.slice(0, dashIndex));
  const conditionId = chartKey.slice(dashIndex + 1) as ConditionId;
  if (Number.isNaN(toothNumber)) return;

  const conditionDef = CONDITIONS.find((c) => c.id === conditionId);
  if (!conditionDef) return;

  if (conditionDef.target === "overlay") {
    await setToothOverlay(patientId, toothNumber, "proposed", conditionId as OverlayType, false);
  } else if (conditionDef.target === "whole") {
    await setToothCondition(patientId, toothNumber, "whole", "proposed", null);
  } else if (conditionDef.target === "surface") {
    for (const abbr of surfaceAbbreviations) {
      const surface = SURFACE_BY_ABBREVIATION[abbr];
      if (surface) await setToothCondition(patientId, toothNumber, surface, "proposed", null);
    }
  }
}

/**
 * Removes a treatment plan item and, if it has one, its drawn proposed-layer
 * chart graphic - the kanban is authoritative, so deleting here is always
 * allowed and always keeps the chart in sync, unlike the old chart-drives-
 * plan direction where only manually-added items could be removed at all.
 */
export async function removeKanbanItem(patientId: string, itemId: string) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("treatment_plan_items")
    .select("treatment_plan_id, chart_key, surfaces")
    .eq("id", itemId)
    .maybeSingle();

  const chartKey = item?.chart_key as string | null | undefined;

  if (chartKey?.startsWith("bridge-")) {
    // A bridge is one clinical unit - removing any of its teeth removes
    // every tooth's plan item and the drawn bridge graphic together, not
    // just the one card that was clicked.
    const bridgeId = bridgeIdFromChartKey(chartKey);
    const { data: siblings } = await supabase
      .from("treatment_plan_items")
      .select("id")
      .eq("treatment_plan_id", item!.treatment_plan_id)
      .like("chart_key", `bridge-${bridgeId}-%`);
    const ids = (siblings ?? []).map((s) => s.id);
    if (ids.length > 0) {
      await supabase.from("sequenced_treatment_plan_items").delete().in("treatment_plan_item_id", ids);
      await supabase.from("treatment_plan_items").delete().in("id", ids);
    }
    await removeBridge(patientId, bridgeId);
    revalidatePath(`/patients/${patientId}`);
    return;
  }

  await supabase.from("sequenced_treatment_plan_items").delete().eq("treatment_plan_item_id", itemId);
  const { error } = await supabase.from("treatment_plan_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  if (chartKey) {
    await eraseProposedGraphic(patientId, chartKey, (item?.surfaces as string[] | null) ?? []);
  }

  revalidatePath(`/patients/${patientId}`);
}

/**
 * Archives the current plan so a fresh one can start: erases every proposed-
 * layer chart graphic its items drew (same erase logic removeKanbanItem uses,
 * batched across the whole plan) but leaves the treatment_plan_items rows
 * alone - they remain as the plan's historical record. Does not create a
 * replacement plan; addProcedureToPlan/addKanbanProcedure already lazily
 * create one the next time something is added with a null treatmentPlanId.
 */
export async function archiveActivePlan(patientId: string, treatmentPlanId: string) {
  const supabase = await createClient();

  const { data: items, error: itemsError } = await supabase
    .from("treatment_plan_items")
    .select("chart_key, surfaces")
    .eq("treatment_plan_id", treatmentPlanId)
    .not("chart_key", "is", null);
  if (itemsError) throw new Error(itemsError.message);

  const erasedBridges = new Set<string>();
  for (const item of items ?? []) {
    const chartKey = item.chart_key as string;
    if (chartKey.startsWith("bridge-")) {
      const bridgeId = bridgeIdFromChartKey(chartKey);
      if (erasedBridges.has(bridgeId)) continue;
      erasedBridges.add(bridgeId);
      await removeBridge(patientId, bridgeId);
    } else {
      await eraseProposedGraphic(patientId, chartKey, (item.surfaces as string[] | null) ?? []);
    }
  }

  const { error } = await supabase
    .from("treatment_plans")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", treatmentPlanId)
    .eq("patient_id", patientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/patients/${patientId}`);
}

export async function updatePlanAdjustment(patientId: string, treatmentPlanId: string, adjustment: number) {
  const supabase = await createClient();
  const clamped = Number.isFinite(adjustment) ? Math.max(0, adjustment) : 0;
  const { error } = await supabase.from("treatment_plans").update({ adjustment: clamped }).eq("id", treatmentPlanId);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
  revalidatePath(`/patients/${patientId}/present`);
}

export async function setPlanAccepted(patientId: string, treatmentPlanId: string, accepted: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("treatment_plans")
    .update({ accepted_at: accepted ? new Date().toISOString() : null })
    .eq("id", treatmentPlanId);

  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
  revalidatePath(`/patients/${patientId}/present`);
}
