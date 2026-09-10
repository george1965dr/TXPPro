"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { KanbanAddInput } from "@/app/actions/treatment-plan";
import type { Procedure } from "@/lib/types";
import { AddProcedureDialog } from "./add-procedure-dialog";
import { VisitColumn } from "./visit-column";
import { initialVisitCount, type BoardItem } from "./board-state";

interface VisitBoardProps {
  patientId: string;
  items: BoardItem[];
  procedures: Procedure[];
  /** The "New plan" confirmation dialog + trigger, owned by the parent (it needs plan/chart state). */
  newPlanButton: React.ReactNode;
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
  newPlanButton,
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
      <div className="flex flex-wrap items-center gap-2">
        <AddProcedureDialog procedures={procedures} onAddKanban={onAddKanban} onAddManual={onAddManual} />
        <Button size="sm" asChild>
          <Link href={`/patients/${patientId}/present`}>Present to patient</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Drag a procedure into a visit to sequence it · click a card&apos;s fee to adjust it
        </p>
        <div className="flex items-center gap-2">
          {newPlanButton}
          <Button variant="outline" size="sm" onClick={() => setVisitCount((c) => c + 1)}>
            + Add visit
          </Button>
        </div>
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
