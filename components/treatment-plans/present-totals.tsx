"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { updatePlanAdjustment } from "@/app/actions/treatment-plan";

interface PresentTotalsProps {
  patientId: string;
  treatmentPlanId: string;
  subtotal: number;
  initialAdjustment: number;
}

export function PresentTotals({ patientId, treatmentPlanId, subtotal, initialAdjustment }: PresentTotalsProps) {
  const [adjustment, setAdjustment] = useState(initialAdjustment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(initialAdjustment));
  const [, startTransition] = useTransition();

  function commit() {
    const next = Number(draft);
    const clamped = Number.isFinite(next) && next >= 0 ? next : 0;
    setEditing(false);
    if (clamped !== adjustment) {
      setAdjustment(clamped);
      startTransition(() => updatePlanAdjustment(patientId, treatmentPlanId, clamped));
    }
  }

  return (
    <div className="flex flex-col gap-1 border-t pt-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Subtotal</p>
        <p>${subtotal.toLocaleString()}</p>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Adjustment</p>
        {editing ? (
          <Input
            autoFocus
            type="number"
            min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(String(adjustment));
                setEditing(false);
              }
            }}
            className="h-6 w-24 text-right text-xs"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(adjustment));
              setEditing(true);
            }}
            className="text-right hover:text-foreground"
            title="Click to edit adjustment"
          >
            {adjustment > 0 ? `-$${adjustment.toLocaleString()}` : "$0"}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        <p className="text-sm font-medium">Total</p>
        <p className="text-xl font-medium">${Math.max(0, subtotal - adjustment).toLocaleString()}</p>
      </div>
    </div>
  );
}
