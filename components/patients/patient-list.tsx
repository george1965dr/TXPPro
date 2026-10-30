"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { restorePatient } from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { formatDateOnly, formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/types";

export type PlanState = "none" | "needs-scheduling" | "ready" | "accepted";

export interface PatientPlanInfo {
  state: PlanState;
  /** What the printed plan's Total would read: fees minus adjustment. */
  total: number;
  /** Procedures not yet placed into a visit. */
  unscheduled: number;
}

interface PatientListProps {
  patients: Patient[];
  /** Keyed by patient id; a patient with no entry has no active plan. */
  planInfo: Record<string, PatientPlanInfo>;
}

type Filter = "all" | PlanState | "archived";

const NO_PLAN: PatientPlanInfo = { state: "none", total: 0, unscheduled: 0 };

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All patients" },
  { key: "needs-scheduling", label: "Needs scheduling" },
  { key: "ready", label: "Ready to review" },
  { key: "accepted", label: "Accepted" },
  { key: "none", label: "No plan yet" },
  { key: "archived", label: "Archived" },
];

const EMPTY_TEXT: Record<Filter, string> = {
  all: "No patients match your search.",
  "needs-scheduling": "Nothing is waiting to be scheduled.",
  ready: "No plan is waiting for review.",
  accepted: "No accepted plans yet.",
  none: "Every patient has a plan started.",
  archived: "No archived patients.",
};

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

function PlanStatus({ info, added }: { info: PatientPlanInfo; added: string }) {
  if (info.state === "none") {
    return (
      <>
        <span className="text-muted-foreground">No plan yet</span>
        <span className="hidden text-muted-foreground sm:inline">Added {added}</span>
      </>
    );
  }

  return (
    <>
      {info.state === "accepted" ? (
        <span className="flex items-center gap-2 font-medium text-success">
          <Orb />
          Accepted
        </span>
      ) : info.state === "ready" ? (
        <span className="font-medium">Ready to review</span>
      ) : (
        <span className="font-medium">{info.unscheduled} to schedule</span>
      )}
      <span className="text-muted-foreground tabular-nums">{formatMoney(info.total)}</span>
    </>
  );
}

export function PatientList({ patients, planInfo }: PatientListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const infoFor = (patient: Patient) => planInfo[patient.id] ?? NO_PLAN;

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: 0,
      "needs-scheduling": 0,
      ready: 0,
      accepted: 0,
      none: 0,
      archived: 0,
    };
    for (const patient of patients) {
      if (patient.archived_at) {
        result.archived++;
        continue;
      }
      result.all++;
      result[(planInfo[patient.id] ?? NO_PLAN).state]++;
    }
    return result;
  }, [patients, planInfo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (filter === "archived" ? !p.archived_at : p.archived_at) return false;
      if (filter !== "all" && filter !== "archived" && (planInfo[p.id] ?? NO_PLAN).state !== filter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    });
  }, [patients, planInfo, query, filter]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[18rem_1fr]">
      <aside className="panel flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-lg font-medium">Show</h2>
          <p className="mt-1 text-sm text-muted-foreground">Where each patient&apos;s plan stands</p>
        </div>

        <div role="group" aria-label="Filter patients by plan status" className="flex flex-col gap-1.5 max-lg:flex-row max-lg:flex-wrap">
          {FILTERS.map(({ key, label }) => {
            const selected = filter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center justify-between rounded-full px-4 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring max-lg:gap-2 max-lg:py-2",
                  selected ? "bg-navy font-medium text-navy-foreground" : "text-foreground hover:bg-foreground/10",
                )}
              >
                {label}
                <span className="tabular-nums">{counts[key]}</span>
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
            {query.trim() ? "No patients match your search." : EMPTY_TEXT[filter]}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {filtered.map((patient) => {
              const born = `Born ${formatDateOnly(patient.birth_date)}${
                patient.email ? ` · ${patient.email}` : ""
              }`;
              const added = formatTimestamp(patient.created_at);

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
                    <p className="hidden text-sm text-muted-foreground sm:block">Added {added}</p>
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
                      <PlanStatus info={infoFor(patient)} added={added} />
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
