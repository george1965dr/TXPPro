"use client";

import { useTransition } from "react";
import { Printer, Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setPlanAccepted } from "@/app/actions/treatment-plan";

interface PresentActionsProps {
  patientId: string;
  treatmentPlanId: string;
  accepted: boolean;
  /** True when at least one plan item hasn't been placed into a visit card yet. */
  hasUnscheduled: boolean;
}

export function PresentActions({ patientId, treatmentPlanId, accepted, hasUnscheduled }: PresentActionsProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1 print:hidden">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
        {accepted ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => setPlanAccepted(patientId, treatmentPlanId, false))}
          >
            <Undo2 className="size-4" />
            Revert to draft
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            disabled={isPending || hasUnscheduled}
            onClick={() => startTransition(() => setPlanAccepted(patientId, treatmentPlanId, true))}
          >
            <Check className="size-4" />
            Mark as accepted
          </Button>
        )}
      </div>
      {!accepted && hasUnscheduled && (
        <p className="text-xs text-muted-foreground">Schedule every procedure into a visit first</p>
      )}
    </div>
  );
}
