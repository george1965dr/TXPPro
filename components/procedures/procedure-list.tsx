"use client";

import { useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProcedureDialog } from "./procedure-dialog";
import { DeleteProcedureButton } from "./delete-procedure-button";
import type { Procedure } from "@/lib/types";

interface ProcedureListProps {
  procedures: Procedure[];
}

export function ProcedureList({ procedures }: ProcedureListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return procedures;
    return procedures.filter(
      (p) => p.ada_code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [procedures, query]);

  if (procedures.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No procedures yet. Add one to start pricing treatment plans.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or name"
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No matching codes</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((procedure) => (
            <Card key={procedure.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold">
                    {procedure.ada_code}
                    <span className="ml-2 font-normal text-muted-foreground">{procedure.description}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-primary">${procedure.fee.toLocaleString()}</span>
                    <span className="text-muted-foreground">
                      {procedure.tooth_required ? " · tooth required" : ""}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ProcedureDialog
                    procedure={procedure}
                    trigger={
                      <Button variant="outline" size="icon" aria-label={`Edit ${procedure.ada_code}`}>
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteProcedureButton procedureId={procedure.id} adaCode={procedure.ada_code} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
