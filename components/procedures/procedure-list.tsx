"use client";

import { useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ProcedureDialog } from "./procedure-dialog";
import { DeleteProcedureButton } from "./delete-procedure-button";
import type { Procedure } from "@/lib/types";

interface ProcedureListProps {
  procedures: Procedure[];
}

/** ADA CDT code sections, keyed by the digit after the D. */
const SECTION_NAMES: Record<string, string> = {
  "0": "Diagnostic",
  "1": "Preventive",
  "2": "Restorative",
  "3": "Endodontics",
  "4": "Periodontics",
  "5": "Removable prosthodontics",
  "6": "Fixed prosthodontics & implants",
  "7": "Oral surgery",
  "8": "Orthodontics",
  "9": "Adjunctive services",
};

const OTHER = "other";

function sectionOf(code: string) {
  const digit = /^D(\d)/i.exec(code)?.[1];
  return digit && SECTION_NAMES[digit] ? digit : OTHER;
}

function sectionName(key: string) {
  return key === OTHER ? "Other codes" : SECTION_NAMES[key];
}

export function ProcedureList({ procedures }: ProcedureListProps) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>("all");

  const sections = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of procedures) counts.set(sectionOf(p.ada_code), (counts.get(sectionOf(p.ada_code)) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => (a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b)));
  }, [procedures]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = procedures.filter(
      (p) =>
        (section === "all" || sectionOf(p.ada_code) === section) &&
        (!q || p.ada_code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    );
    const byKey = new Map<string, Procedure[]>();
    for (const p of matching) {
      const key = sectionOf(p.ada_code);
      byKey.set(key, [...(byKey.get(key) ?? []), p]);
    }
    return sections.filter(([key]) => byKey.has(key)).map(([key]) => ({ key, items: byKey.get(key)! }));
  }, [procedures, query, section, sections]);

  if (procedures.length === 0) {
    return (
      <p className="panel p-10 text-center text-muted-foreground">
        No procedures yet. Add one to start pricing treatment plans.
      </p>
    );
  }

  const filters = [{ key: "all", label: "All codes", count: procedures.length }].concat(
    sections.map(([key, count]) => ({ key, label: sectionName(key), count })),
  );

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[18rem_1fr]">
      <aside className="panel flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-lg font-medium">Sections</h2>
          <p className="mt-1 text-sm text-muted-foreground">The ADA code ranges you price</p>
        </div>
        <div role="group" aria-label="Filter codes by section" className="flex flex-col gap-1.5 max-lg:flex-row max-lg:flex-wrap">
          {filters.map(({ key, label, count }) => {
            const selected = section === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setSection(key)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-full px-4 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring max-lg:py-2",
                  selected ? "bg-navy font-medium text-navy-foreground" : "text-foreground hover:bg-foreground/10",
                )}
              >
                {label}
                <span className="tabular-nums">{count}</span>
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
            aria-label="Search procedures"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or name"
            className="h-11 rounded-full border-white/70 bg-white/80 pl-11 dark:border-white/10 dark:bg-white/5"
          />
        </div>

        {groups.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No matching codes</p>
        ) : (
          groups.map(({ key, items }) => (
            <div key={key}>
              <h3 className="mb-1 flex items-baseline justify-between border-b-2 border-foreground/70 pb-1.5 text-base font-semibold">
                {sectionName(key)}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">{items.length}</span>
              </h3>
              <ul>
                {items.map((procedure) => (
                  <li
                    key={procedure.id}
                    className="flex items-center gap-4 border-b border-foreground/10 py-2.5 last:border-b-0"
                  >
                    <span className="w-16 shrink-0 text-sm font-medium tabular-nums">{procedure.ada_code}</span>
                    <div className="min-w-0 flex-1">
                      <p>{procedure.description}</p>
                      {procedure.tooth_required && <p className="text-sm text-muted-foreground">Tooth required</p>}
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">{formatMoney(procedure.fee)}</span>
                    <div className="flex shrink-0 items-center gap-2">
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
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
