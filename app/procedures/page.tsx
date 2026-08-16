import { createClient } from "@/lib/supabase/server";
import { ProcedureDialog } from "@/components/procedures/procedure-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import type { Procedure } from "@/lib/types";

export default async function ProceduresPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("procedures").select("*").order("ada_code", { ascending: true });
  const procedures = (data ?? []) as Procedure[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Procedures</h1>
          <p className="text-sm text-muted-foreground">
            The fee schedule the odontogram and treatment plans price against.
          </p>
        </div>
        <ProcedureDialog />
      </div>

      {procedures.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No procedures yet. Add one to start pricing treatment plans.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {procedures.map((procedure) => (
            <Card key={procedure.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {procedure.ada_code}
                    <span className="ml-2 font-normal text-muted-foreground">{procedure.description}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${procedure.fee.toLocaleString()}
                    {procedure.tooth_required ? " · tooth required" : ""}
                  </p>
                </div>
                <ProcedureDialog
                  procedure={procedure}
                  trigger={
                    <Button variant="outline" size="icon" aria-label={`Edit ${procedure.ada_code}`}>
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
