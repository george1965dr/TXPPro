import { createClient } from "@/lib/supabase/server";
import { NewPatientDialog } from "@/components/patients/new-patient-dialog";
import { PatientList, type PatientPlanInfo } from "@/components/patients/patient-list";
import type { Patient } from "@/lib/types";

interface ActivePlanRow {
  id: string;
  patient_id: string;
  accepted_at: string | null;
  adjustment: number | null;
}

export default async function PatientsPage() {
  const supabase = await createClient();
  const [{ data: patientRows }, { data: planRows }] = await Promise.all([
    supabase.from("patients").select("*").order("created_at", { ascending: false }),
    supabase.from("treatment_plans").select("id, patient_id, accepted_at, adjustment").is("archived_at", null),
  ]);
  const patients = (patientRows ?? []) as Patient[];
  const plans = (planRows ?? []) as ActivePlanRow[];
  const planIds = plans.map((p) => p.id);

  // Each patient has at most one non-archived plan. What a patient's tile shows
  // is where that plan stands: how much is on it and whether every procedure
  // has been placed into a visit - the same numbers the printed plan uses.
  const [{ data: itemRows }, { data: sequencedPlanRows }] = planIds.length
    ? await Promise.all([
        supabase.from("treatment_plan_items").select("id, treatment_plan_id, fee").in("treatment_plan_id", planIds),
        supabase.from("sequenced_treatment_plans").select("id, treatment_plan_id").in("treatment_plan_id", planIds),
      ])
    : [{ data: [] }, { data: [] }];

  const sequencedPlanIds = (sequencedPlanRows ?? []).map((s) => s.id as string);
  const { data: scheduledRows } = sequencedPlanIds.length
    ? await supabase
        .from("sequenced_treatment_plan_items")
        .select("treatment_plan_item_id")
        .in("sequenced_treatment_plan_id", sequencedPlanIds)
    : { data: [] };

  const scheduledItemIds = new Set((scheduledRows ?? []).map((r) => r.treatment_plan_item_id as string));

  const planInfo: Record<string, PatientPlanInfo> = {};
  for (const plan of plans) {
    const items = (itemRows ?? []).filter((i) => i.treatment_plan_id === plan.id);
    const subtotal = items.reduce((sum, i) => sum + Number(i.fee), 0);
    const unscheduled = items.filter((i) => !scheduledItemIds.has(i.id as string)).length;

    planInfo[plan.patient_id] =
      items.length === 0
        ? { state: "none", total: 0, unscheduled: 0 }
        : {
            state: plan.accepted_at ? "accepted" : unscheduled > 0 ? "needs-scheduling" : "ready",
            total: Math.max(0, subtotal - Number(plan.adjustment ?? 0)),
            unscheduled,
          };
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-8 pt-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-light tracking-tight">Patients</h1>
        <NewPatientDialog />
      </div>

      <PatientList patients={patients} planInfo={planInfo} />
    </div>
  );
}
