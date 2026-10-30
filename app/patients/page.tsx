import { createClient } from "@/lib/supabase/server";
import { NewPatientDialog } from "@/components/patients/new-patient-dialog";
import { PatientList } from "@/components/patients/patient-list";
import type { Patient } from "@/lib/types";

export default async function PatientsPage() {
  const supabase = await createClient();
  const [{ data }, { count: totalPlans }, { count: acceptedPlans }, { data: activePlans }] = await Promise.all([
    supabase.from("patients").select("*").order("created_at", { ascending: false }),
    supabase.from("treatment_plans").select("*", { count: "exact", head: true }),
    supabase.from("treatment_plans").select("*", { count: "exact", head: true }).not("accepted_at", "is", null),
    supabase.from("treatment_plans").select("patient_id, accepted_at").is("archived_at", null),
  ]);
  const patients = (data ?? []) as Patient[];
  // Each patient has at most one non-archived plan - its acceptance is what the dashboard card shows.
  const acceptedPatientIds = (activePlans ?? [])
    .filter((p) => p.accepted_at != null)
    .map((p) => p.patient_id as string);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-8 pt-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-light tracking-tight">Patients</h1>
        <NewPatientDialog />
      </div>

      <PatientList
        patients={patients}
        acceptedPatientIds={acceptedPatientIds}
        totalPlans={totalPlans ?? 0}
        acceptedPlans={acceptedPlans ?? 0}
      />
    </div>
  );
}
