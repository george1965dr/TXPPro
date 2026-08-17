"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { restorePatient } from "@/app/actions/patients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Patient } from "@/lib/types";

export function PatientList({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const archivedCount = useMemo(() => patients.filter((p) => p.archived_at).length, [patients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (showArchived ? !p.archived_at : p.archived_at) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    });
  }, [patients, query, showArchived]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search patients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
        >
          Archived {archivedCount > 0 ? `(${archivedCount})` : ""}
        </Button>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No patients yet. Add one to start a treatment plan.
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {showArchived ? "No archived patients." : "No patients match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((patient) =>
            patient.archived_at ? (
              <Card key={patient.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{patient.name}</p>
                      <Badge variant="secondary">Archived</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Born {new Date(patient.birth_date).toLocaleDateString()}
                      {patient.email ? ` · ${patient.email}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/patients/${patient.id}`}>View</Link>
                    </Button>
                    <form action={restorePatient.bind(null, patient.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        Restore
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ) : (
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
            ),
          )}
        </div>
      )}
    </div>
  );
}
