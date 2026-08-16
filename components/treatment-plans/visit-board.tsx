"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KanbanAddInput } from "@/app/actions/treatment-plan";
import type { Procedure } from "@/lib/types";
import { AddProcedureDialog } from "./add-procedure-dialog";
import { VisitColumn } from "./visit-column";
import { initialVisitCount, type BoardItem } from "./board-state";

interface VisitBoardProps {
  patientId: string;
  items: BoardItem[];
  procedures: Procedure[];
  isSaving: boolean;
  onAddManual: (procedure: Procedure, toothNumber?: number) => void;
  onAddKanban: (input: KanbanAddInput) => void;
  onRemove: (itemId: string) => void;
  onMove: (itemId: string, appointmentNumber: number | null) => void;
  onFeeChange: (itemId: string, fee: number) => void;
}

export function VisitBoard({
  patientId,
  items,
  procedures,
  isSaving,
  onAddManual,
  onAddKanban,
  onRemove,
  onMove,
  onFeeChange,
}: VisitBoardProps) {
  const [visitCount, setVisitCount] = useState(() => initialVisitCount(items));

  const grandTotal = items.reduce((sum, item) => sum + item.fee, 0);
  const visitNumbers = Array.from({ length: visitCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AddProcedureDialog procedures={procedures} onAddKanban={onAddKanban} onAddManual={onAddManual} />
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" asChild>
            <Link href={`/patients/${patientId}/present`}>Present to patient</Link>
          </Button>
          <span
            role="status"
            aria-label={isSaving ? "Saving" : "Saved"}
            title={isSaving ? "Saving…" : "Saved"}
            className={cn(
              "size-2.5 rounded-full transition-colors",
              isSaving ? "bg-muted-foreground/30" : "bg-green-500",
            )}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Drag a procedure into a visit to sequence it · click a card&apos;s fee to adjust it
        </p>
        <Button variant="outline" size="sm" onClick={() => setVisitCount((c) => c + 1)}>
          + Add visit
        </Button>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${visitNumbers.length + 1}, minmax(140px, 1fr))` }}
      >
        <VisitColumn
          label="Unscheduled"
          items={items.filter((item) => item.appointmentNumber === null)}
          onDropItem={(itemId) => onMove(itemId, null)}
          onRemoveItem={onRemove}
          onFeeChange={onFeeChange}
        />
        {visitNumbers.map((n) => (
          <VisitColumn
            key={n}
            label={`Visit ${n}`}
            items={items.filter((item) => item.appointmentNumber === n)}
            onDropItem={(itemId) => onMove(itemId, n)}
            onRemoveItem={onRemove}
            onFeeChange={onFeeChange}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <p className="text-sm text-muted-foreground">
          {visitNumbers.length} visits · {items.length} procedures
        </p>
        <p className="text-base font-medium">Plan total: ${grandTotal.toLocaleString()}</p>
      </div>
    </div>
  );
}
