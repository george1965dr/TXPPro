"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { updatePlanAdjustment } from "@/app/actions/treatment-plan";
import { useSaveTracker } from "@/components/save-status";
import { formatMoney } from "@/lib/money";

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
  const { track } = useSaveTracker();

  function commit() {
    const next = Number(draft);
    const clamped = Number.isFinite(next) && next >= 0 ? next : 0;
    setEditing(false);
    if (clamped !== adjustment) {
      setAdjustment(clamped);
      startTransition(async () => {
        await track("Plan adjustment", () => updatePlanAdjustment(patientId, treatmentPlanId, clamped));
      });
    }
  }

  return (
    <div className="ml-auto flex w-full max-w-xs break-inside-avoid flex-col gap-1.5">
      <div className="flex items-center justify-between text-base">
        <p>Subtotal</p>
        <p className="tabular-nums">{formatMoney(subtotal)}</p>
      </div>
      <div className="flex items-center justify-between text-base">
        <p>Adjustment</p>
        {editing ? (
          <Input
            autoFocus
            type="number"
            min={0}
            step="0.01"
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
            className="h-7 w-28 text-right text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(adjustment));
              setEditing(true);
            }}
            className="text-right tabular-nums underline decoration-dotted underline-offset-4 print:no-underline"
            title="Click to edit adjustment"
          >
            {adjustment > 0 ? `−${formatMoney(adjustment)}` : formatMoney(0)}
          </button>
        )}
      </div>
      <div className="mt-1 flex items-baseline justify-between border-t-2 border-foreground pt-2">
        <p className="text-lg font-semibold">Total</p>
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(Math.max(0, subtotal - adjustment))}</p>
      </div>
    </div>
  );
}
