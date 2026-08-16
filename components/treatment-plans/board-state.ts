import type { SequencedTreatmentPlanItem, TreatmentPlanItem } from "@/lib/types";

export interface BoardItem {
  id: string;
  procedureId: string;
  adaCode: string;
  description: string;
  /** Snapshotted at add-time (or later edited) - never the live procedure.fee. */
  fee: number;
  appointmentNumber: number | null;
  /** Links this item to its drawn proposed-layer chart graphic. Null for tooth-less items (e.g. a cleaning). */
  chartKey: string | null;
  /** Which tooth this applies to - null for items with no tooth context (e.g. manually added cleanings). */
  toothNumber: number | null;
  /** Surface abbreviations charted (e.g. ["M","O","D"]) - empty for whole-tooth/overlay/bridge items. */
  surfaces: string[];
}

export function buildBoardItems(
  items: TreatmentPlanItem[],
  sequencedItems: SequencedTreatmentPlanItem[],
): BoardItem[] {
  const appointmentByItemId = new Map(
    sequencedItems.map((s) => [s.treatment_plan_item_id, s.appointment_number]),
  );

  return items
    .filter((item) => item.procedure)
    .map((item) => ({
      id: item.id,
      procedureId: item.procedure_id,
      adaCode: item.procedure!.ada_code,
      description: item.procedure!.description,
      fee: item.fee,
      appointmentNumber: appointmentByItemId.get(item.id) ?? null,
      chartKey: item.chart_key ?? null,
      toothNumber: item.tooth_numbers?.[0] ? Number(item.tooth_numbers[0]) : null,
      surfaces: item.surfaces ?? [],
    }));
}

export function initialVisitCount(items: BoardItem[]): number {
  const highest = items.reduce((max, item) => Math.max(max, item.appointmentNumber ?? 0), 0);
  return Math.max(3, highest);
}
