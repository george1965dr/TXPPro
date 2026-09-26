"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PROCEDURE_CATALOG } from "@/lib/dental/procedure-catalog";
import { SURFACE_ABBREVIATION, SURFACE_ORDER, resolveBridgeRange, toothPosition } from "@/lib/dental/tooth-geometry";
import type { KanbanAddInput } from "@/app/actions/treatment-plan";
import type { Procedure, ToothSurface } from "@/lib/types";

function parseTooth(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 32 ? n : null;
}

interface AddProcedureDialogProps {
  procedures: Procedure[];
  onAddKanban: (input: KanbanAddInput) => void;
  onAddManual: (procedure: Procedure, toothNumber?: number) => void;
}

/**
 * "+ Add procedure": a flat, code-ordered catalog search (the master
 * procedure list is the single source of truth for what's billable and at
 * what fee) rather than browsing a clinical taxonomy. Picking a code that's
 * part of the chart taxonomy (see procedure-catalog.ts) still routes through
 * addKanbanProcedure so it draws the proposed-layer graphic exactly as
 * before; anything else falls back to the procedure's own `tooth_required`
 * flag (set in Procedures settings) to decide whether to ask for a tooth.
 */
export function AddProcedureDialog({ procedures, onAddKanban, onAddManual }: AddProcedureDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Procedure | null>(null);
  const [toothNumber, setToothNumber] = useState("");
  const [secondToothNumber, setSecondToothNumber] = useState("");
  const [surfaces, setSurfaces] = useState<ToothSurface[]>([]);
  // null = untouched: both end teeth are abutments (the common case). Any
  // toggle switches to an explicit list, and editing either end resets it.
  const [abutmentOverride, setAbutmentOverride] = useState<number[] | null>(null);

  const sorted = useMemo(
    () => [...procedures].sort((a, b) => a.ada_code.localeCompare(b.ada_code)),
    [procedures],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (p) => p.ada_code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  function reset() {
    setQuery("");
    setSelected(null);
    setToothNumber("");
    setSecondToothNumber("");
    setSurfaces([]);
    setAbutmentOverride(null);
  }

  function pickProcedure(p: Procedure) {
    const entry = PROCEDURE_CATALOG.get(p.ada_code);
    if (!entry && !p.tooth_required) {
      onAddManual(p);
      setOpen(false);
      reset();
      return;
    }
    setSelected(p);
    setToothNumber("");
    setSecondToothNumber("");
    setSurfaces([]);
    setAbutmentOverride(null);
  }

  function toggleAbutment(toothNumber: number) {
    const base = abutmentOverride ?? bridgeEndTeeth;
    setAbutmentOverride(
      base.includes(toothNumber) ? base.filter((t) => t !== toothNumber) : [...base, toothNumber],
    );
  }

  function toggleSurface(surface: ToothSurface) {
    setSurfaces((prev) => (prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface]));
  }

  const entry = selected ? PROCEDURE_CATALOG.get(selected.ada_code) ?? null : null;
  const parsedTooth = parseTooth(toothNumber);

  const expectedPosition =
    entry?.toothMode === "overlay" || entry?.toothMode === "surface" ? entry.expectedPosition : undefined;
  const actualPosition = parsedTooth !== null ? toothPosition(parsedTooth) : null;
  const positionMismatch =
    expectedPosition && actualPosition
      ? expectedPosition === "posterior"
        ? actualPosition === "anterior"
        : actualPosition !== expectedPosition
      : false;
  const positionError = positionMismatch
    ? `Tooth #${parsedTooth} is a ${actualPosition} tooth — this code is for ${expectedPosition} teeth.`
    : null;

  const surfaceCountError =
    entry?.toothMode === "surface" && surfaces.length > 0 && (surfaces.length < entry.minSurfaces || (entry.maxSurfaces !== null && surfaces.length > entry.maxSurfaces))
      ? entry.minSurfaces === entry.maxSurfaces
        ? `Pick exactly ${entry.minSurfaces} surface${entry.minSurfaces === 1 ? "" : "s"} for this code.`
        : entry.maxSurfaces === null
          ? `Pick at least ${entry.minSurfaces} surfaces for this code.`
          : `Pick ${entry.minSurfaces}–${entry.maxSurfaces} surfaces for this code.`
      : null;

  const parsedSecondTooth = parseTooth(secondToothNumber);

  const bridgeSpanPreview =
    entry?.toothMode === "bridge" && parsedTooth !== null && parsedSecondTooth !== null
      ? resolveBridgeRange(parsedTooth, parsedSecondTooth)
      : null;
  const bridgeSpanTeeth = bridgeSpanPreview ? bridgeSpanPreview.map((t) => t.toothNumber) : [];
  const bridgeEndTeeth = bridgeSpanTeeth.length > 0 ? [bridgeSpanTeeth[0], bridgeSpanTeeth[bridgeSpanTeeth.length - 1]] : [];
  const activeAbutments = (abutmentOverride ?? bridgeEndTeeth).filter((t) => bridgeSpanTeeth.includes(t));

  const bridgeTeeth =
    entry?.toothMode === "bridge" && parsedTooth !== null && parsedSecondTooth !== null
      ? resolveBridgeRange(parsedTooth, parsedSecondTooth, activeAbutments)
      : null;
  const noAbutmentError =
    bridgeSpanPreview && bridgeTeeth === null ? "Pick at least one abutment." : null;

  const canSubmit = !selected
    ? false
    : !entry
      ? parsedTooth !== null
      : entry.toothMode === "bridge"
        ? bridgeTeeth !== null
        : entry.toothMode === "surface"
          ? parsedTooth !== null && surfaces.length > 0 && !surfaceCountError && !positionError
          : parsedTooth !== null && !positionError;

  function submit() {
    if (!selected || !canSubmit) return;

    if (!entry) {
      onAddManual(selected, parsedTooth!);
    } else if (entry.toothMode === "bridge") {
      onAddKanban({ kind: "bridge", conditionId: entry.conditionId, teeth: bridgeTeeth! });
    } else if (entry.toothMode === "whole") {
      onAddKanban({ kind: "whole", conditionId: entry.conditionId, toothNumber: parsedTooth! });
    } else if (entry.toothMode === "overlay") {
      onAddKanban({ kind: "overlay", conditionId: entry.conditionId, toothNumber: parsedTooth! });
    } else {
      onAddKanban({ kind: "surface", conditionId: entry.conditionId, toothNumber: parsedTooth!, surfaces });
    }

    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" />
          Add procedure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Add procedure to plan</DialogTitle>
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Back to search
            </button>
          ) : (
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
          )}
        </DialogHeader>

        {!selected ? (
          <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProcedure(p)}
                className="flex items-baseline justify-between gap-3 rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm hover:border-border hover:bg-accent/50"
              >
                <span>
                  <span className="font-medium">{p.ada_code}</span>{" "}
                  <span className="text-muted-foreground">{p.description}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">${p.fee.toLocaleString()}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-2.5 py-1.5 text-sm text-muted-foreground">No matches</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{selected.ada_code}</p>
              <p className="text-muted-foreground">{selected.description}</p>
              <p className="mt-1 text-muted-foreground">${selected.fee.toLocaleString()}</p>
            </div>

            {entry?.toothMode === "bridge" ? (
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tooth1">First tooth</Label>
                  <Input
                    id="tooth1"
                    autoFocus
                    type="number"
                    min={1}
                    max={32}
                    value={toothNumber}
                    onChange={(e) => {
                      setToothNumber(e.target.value);
                      setAbutmentOverride(null);
                    }}
                    className="w-24"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tooth2">Last tooth</Label>
                  <Input
                    id="tooth2"
                    type="number"
                    min={1}
                    max={32}
                    value={secondToothNumber}
                    onChange={(e) => {
                      setSecondToothNumber(e.target.value);
                      setAbutmentOverride(null);
                    }}
                    className="w-24"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tooth">Tooth number</Label>
                <Input
                  id="tooth"
                  autoFocus
                  type="number"
                  min={1}
                  max={32}
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  className="w-24"
                />
                {positionError && <p className="text-xs text-destructive">{positionError}</p>}
              </div>
            )}

            {entry?.toothMode === "bridge" && bridgeSpanTeeth.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Abutments</Label>
                <p className="text-xs text-muted-foreground">
                  Select every tooth that is an abutment - all other teeth in the span are pontics.
                  Both ends start selected; deselect an end for a cantilever.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {bridgeSpanTeeth.map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => toggleAbutment(tooth)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-sm",
                        activeAbutments.includes(tooth)
                          ? "border-foreground/40 bg-accent font-medium"
                          : "border-border text-muted-foreground hover:bg-accent/50",
                      )}
                    >
                      #{tooth}
                    </button>
                  ))}
                </div>
                {noAbutmentError && <p className="text-xs text-destructive">{noAbutmentError}</p>}
              </div>
            )}

            {entry?.toothMode === "surface" && (
              <div className="flex flex-col gap-1.5">
                <Label>Surfaces</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SURFACE_ORDER.map((surface) => (
                    <button
                      key={surface}
                      type="button"
                      onClick={() => toggleSurface(surface)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-sm",
                        surfaces.includes(surface)
                          ? "border-foreground/40 bg-accent font-medium"
                          : "border-border text-muted-foreground hover:bg-accent/50",
                      )}
                    >
                      {SURFACE_ABBREVIATION[surface]}
                    </button>
                  ))}
                </div>
                {surfaceCountError && <p className="text-xs text-destructive">{surfaceCountError}</p>}
              </div>
            )}

            <Button onClick={submit} disabled={!canSubmit}>
              Add to plan
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
