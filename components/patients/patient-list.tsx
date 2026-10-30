"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { restorePatient } from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/types";

interface PatientListProps {
  patients: Patient[];
  acceptedPatientIds: string[];
  totalPlans: number;
  acceptedPlans: number;
}

const tile =
  "flex items-center gap-4 rounded-2xl border border-foreground/[0.06] bg-white/80 p-4 shadow-[0_1px_2px_oklch(0.35_0.08_262/0.08),0_6px_16px_-8px_oklch(0.35_0.08_262/0.14)] dark:border-white/10 dark:bg-white/5 dark:shadow-none";

function hueFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      style={{ "--h": hueFor(name) } as React.CSSProperties}
      className="grid size-12 shrink-0 place-items-center rounded-full bg-[oklch(0.9_0.06_var(--h))] text-sm font-medium text-[oklch(0.35_0.09_var(--h))] dark:bg-[oklch(0.34_0.07_var(--h))] dark:text-[oklch(0.9_0.06_var(--h))]"
    >
      {initials(name)}
    </span>
  );
}

function Orb() {
  return (
    <span
      aria-hidden
      className="size-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,color-mix(in_oklch,var(--success)_45%,white),var(--success))]"
    />
  );
}

export function PatientList({ patients, acceptedPatientIds, totalPlans, acceptedPlans }: PatientListProps) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const acceptedIds = useMemo(() => new Set(acceptedPatientIds), [acceptedPatientIds]);
  const archivedCount = useMemo(() => patients.filter((p) => p.archived_at).length, [patients]);
  const activeCount = patients.length - archivedCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (showArchived ? !p.archived_at : p.archived_at) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    });
  }, [patients, query, showArchived]);

  const views = [
    { archived: false, label: "Active patients", count: activeCount },
    { archived: true, label: "Archived", count: archivedCount },
  ];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[18rem_1fr]">
      <aside className="panel flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-lg font-medium">Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Treatment plans across the practice</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div className={cn(tile, "flex-col items-start gap-1 p-4")}>
            <dt className="text-sm text-muted-foreground">Total plans</dt>
            <dd className="text-4xl font-light tabular-nums">{totalPlans}</dd>
          </div>
          <div className={cn(tile, "flex-col items-start gap-1 p-4")}>
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Orb />
              Accepted
            </dt>
            <dd className="text-4xl font-light tabular-nums">{acceptedPlans}</dd>
          </div>
        </dl>

        <div role="group" aria-label="Which patients to show" className="flex flex-col gap-1.5">
          {views.map((view) => {
            const selected = showArchived === view.archived;
            return (
              <button
                key={view.label}
                type="button"
                aria-pressed={selected}
                onClick={() => setShowArchived(view.archived)}
                className={cn(
                  "flex items-center justify-between rounded-full px-4 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-navy font-medium text-navy-foreground"
                    : "text-foreground hover:bg-foreground/10",
                )}
              >
                {view.label}
                <span className="tabular-nums">{view.count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="panel flex min-w-0 flex-col gap-5 p-6">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search patients"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-full border-white/70 bg-white/80 pl-11 dark:border-white/10 dark:bg-white/5"
          />
        </div>

        {patients.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            No patients yet. Add one to start a treatment plan.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {showArchived ? "No archived patients." : "No patients match your search."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {filtered.map((patient) => {
              const born = `Born ${new Date(patient.birth_date).toLocaleDateString()}${
                patient.email ? ` · ${patient.email}` : ""
              }`;
              const added = `Added ${new Date(patient.created_at).toLocaleDateString()}`;

              if (patient.archived_at) {
                return (
                  <li key={patient.id} className={tile}>
                    <Avatar name={patient.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{patient.name}</p>
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs">Archived</span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{born}</p>
                    </div>
                    <p className="hidden text-sm text-muted-foreground sm:block">{added}</p>
                    <Button variant="outline" size="sm" className="h-8 rounded-full px-3" asChild>
                      <Link href={`/patients/${patient.id}`}>View</Link>
                    </Button>
                    <form action={restorePatient.bind(null, patient.id)}>
                      <Button type="submit" variant="secondary" size="sm" className="h-8 rounded-full px-3">
                        Restore
                      </Button>
                    </form>
                  </li>
                );
              }

              return (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className={cn(
                      tile,
                      "outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10",
                    )}
                  >
                    <Avatar name={patient.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{patient.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{born}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                      {acceptedIds.has(patient.id) && (
                        <span className="flex items-center gap-2 font-medium text-success">
                          <Orb />
                          Accepted
                        </span>
                      )}
                      <span className="hidden text-muted-foreground sm:inline">{added}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
