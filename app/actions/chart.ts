"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BridgeRole, BridgeType, ChartLayer, OverlayType } from "@/lib/types";

/**
 * Sets or clears a single surface/whole-tooth entry on the odontogram.
 * Pass conditionType = null to erase. One row per (patient, tooth, surface,
 * layer) - upsert keeps existing vs. proposed layers independent so
 * toggling one never touches the other.
 */
export async function setToothCondition(
  patientId: string,
  toothNumber: number,
  surface: string,
  layer: ChartLayer,
  conditionType: string | null,
) {
  const supabase = await createClient();

  if (conditionType === null) {
    const { error } = await supabase
      .from("tooth_conditions")
      .delete()
      .match({ patient_id: patientId, tooth_number: toothNumber, surface, layer });

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("tooth_conditions").upsert(
      {
        patient_id: patientId,
        tooth_number: toothNumber,
        surface,
        layer,
        condition_type: conditionType,
      },
      { onConflict: "patient_id,tooth_number,surface,layer" },
    );

    if (error) throw new Error(error.message);
  }

  revalidatePath(`/patients/${patientId}`);
}

/**
 * Toggles a single overlay flag (root canal, periapical lesion, etc.) for a
 * tooth. Unlike setToothCondition this is a set-membership toggle, not a
 * single-slot upsert - a tooth can carry several overlays at once, so
 * "present" just means insert-if-missing / delete-if-present.
 */
export async function setToothOverlay(
  patientId: string,
  toothNumber: number,
  layer: ChartLayer,
  overlayType: OverlayType,
  present: boolean,
) {
  const supabase = await createClient();

  if (!present) {
    const { error } = await supabase
      .from("tooth_overlays")
      .delete()
      .match({ patient_id: patientId, tooth_number: toothNumber, layer, overlay_type: overlayType });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("tooth_overlays").upsert(
      { patient_id: patientId, tooth_number: toothNumber, layer, overlay_type: overlayType },
      { onConflict: "patient_id,tooth_number,layer,overlay_type" },
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/patients/${patientId}`);
}

/**
 * Creates a bridge spanning the given teeth in one call - the two-click
 * "first abutment, last abutment" flow resolves to a full teeth list
 * (abutments at the ends, pontics in between) before calling this, so the
 * bridge and its membership are created atomically rather than teeth
 * trickling in one at a time.
 */
export async function createBridge(
  patientId: string,
  layer: ChartLayer,
  bridgeType: BridgeType,
  teeth: { toothNumber: number; role: BridgeRole }[],
) {
  const supabase = await createClient();

  const { data: bridge, error: bridgeError } = await supabase
    .from("bridges")
    .insert({ patient_id: patientId, layer, bridge_type: bridgeType })
    .select("id")
    .single();
  if (bridgeError) throw new Error(bridgeError.message);

  const { error: teethError } = await supabase.from("bridge_teeth").insert(
    teeth.map((t) => ({ bridge_id: bridge.id, tooth_number: t.toothNumber, role: t.role })),
  );
  if (teethError) throw new Error(teethError.message);

  revalidatePath(`/patients/${patientId}`);
  return { bridgeId: bridge.id as string };
}

export async function removeBridge(patientId: string, bridgeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bridges").delete().eq("id", bridgeId);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}
