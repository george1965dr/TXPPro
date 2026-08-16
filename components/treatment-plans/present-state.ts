import type { SequencedTreatmentPlanItem, TreatmentPlanItem } from "@/lib/types";

export interface PresentLineItem {
  id: string;
  adaCode: string;
  description: string;
  fee: number;
  toothNumber: number | null;
  surfaces: string[];
}

export interface PresentVisit {
  label: string;
  items: PresentLineItem[];
  subtotal: number;
}

export interface PresentSummary {
  visits: PresentVisit[];
  unscheduled: PresentVisit;
  grandTotal: number;
}

function toLineItem(item: TreatmentPlanItem): PresentLineItem | null {
  if (!item.procedure) return null;
  return {
    id: item.id,
    adaCode: item.procedure.ada_code,
    description: item.procedure.description,
    fee: item.fee,
    toothNumber: item.tooth_numbers?.[0] ? Number(item.tooth_numbers[0]) : null,
    surfaces: item.surfaces ?? [],
  };
}

export function buildPresentSummary(
  items: TreatmentPlanItem[],
  sequencedItems: SequencedTreatmentPlanItem[],
): PresentSummary {
  const appointmentByItemId = new Map(sequencedItems.map((s) => [s.treatment_plan_item_id, s.appointment_number]));
  const visitNumbers = [...new Set(sequencedItems.map((s) => s.appointment_number))].sort((a, b) => a - b);

  const visits: PresentVisit[] = visitNumbers.map((n) => {
    const visitItems = items
      .filter((item) => appointmentByItemId.get(item.id) === n)
      .map(toLineItem)
      .filter((x): x is PresentLineItem => x !== null);
    return { label: `Visit ${n}`, items: visitItems, subtotal: visitItems.reduce((sum, i) => sum + i.fee, 0) };
  });

  const unscheduledItems = items
    .filter((item) => !appointmentByItemId.has(item.id))
    .map(toLineItem)
    .filter((x): x is PresentLineItem => x !== null);
  const unscheduled: PresentVisit = {
    label: "To be scheduled",
    items: unscheduledItems,
    subtotal: unscheduledItems.reduce((sum, i) => sum + i.fee, 0),
  };

  const grandTotal = [...visits, unscheduled].reduce((sum, v) => sum + v.subtotal, 0);

  return { visits, unscheduled, grandTotal };
}
