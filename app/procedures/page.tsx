import { createClient } from "@/lib/supabase/server";
import { ProcedureDialog } from "@/components/procedures/procedure-dialog";
import { ProcedureList } from "@/components/procedures/procedure-list";
import type { Procedure } from "@/lib/types";

export default async function ProceduresPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("procedures").select("*").order("ada_code", { ascending: true });
  const procedures = (data ?? []) as Procedure[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procedures</h1>
          <p className="text-sm text-muted-foreground">
            The fee schedule the odontogram and treatment plans price against.
          </p>
        </div>
        <ProcedureDialog />
      </div>

      <ProcedureList procedures={procedures} />
    </div>
  );
}
