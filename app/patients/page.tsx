import { createClient } from "@/lib/supabase/server";
import { NewPatientDialog } from "@/components/patients/new-patient-dialog";
import { PatientList } from "@/components/patients/patient-list";
import { StatsCards } from "@/components/patients/stats-cards";
import type { Patient } from "@/lib/types";

export default async function PatientsPage() {
  const supabase = await createClient();
  const [{ data }, { count: totalPlans }, { count: acceptedPlans }] = await Promise.all([
    supabase.from("patients").select("*").order("name", { ascending: true }),
    supabase.from("treatment_plans").select("*", { count: "exact", head: true }),
    supabase.from("treatment_plans").select("*", { count: "exact", head: true }).not("accepted_at", "is", null),
  ]);
  const patients = (data ?? []) as Patient[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        <NewPatientDialog />
      </div>

      <StatsCards totalPlans={totalPlans ?? 0} acceptedPlans={acceptedPlans ?? 0} />

      <PatientList patients={patients} />
    </div>
  );
}
