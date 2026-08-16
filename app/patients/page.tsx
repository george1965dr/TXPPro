import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewPatientDialog } from "@/components/patients/new-patient-dialog";
import { Card, CardContent } from "@/components/ui/card";
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

      {!patients || patients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No patients yet. Add one to start a treatment plan.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {patients.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Born {new Date(patient.birth_date).toLocaleDateString()}
                      {patient.email ? ` · ${patient.email}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
