import { createClient } from "@/lib/supabase/server";
import { NewPatientDialog } from "@/components/patients/new-patient-dialog";
import { PatientList } from "@/components/patients/patient-list";
import type { Patient } from "@/lib/types";

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("patients").select("*").order("name", { ascending: true });
  const patients = (data ?? []) as Patient[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Patients</h1>
        <NewPatientDialog />
      </div>

      <PatientList patients={patients} />
    </div>
  );
}
