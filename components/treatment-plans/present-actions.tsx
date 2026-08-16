"use client";

import { useTransition } from "react";
import { Printer, Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setPlanAccepted } from "@/app/actions/treatment-plan";

interface PresentActionsProps {
  patientId: string;
  treatmentPlanId: string;
  accepted: boolean;
}

export function PresentActions({ patientId, treatmentPlanId, accepted }: PresentActionsProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2 print:hidden">
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
          disabled={isPending}
          onClick={() => startTransition(() => setPlanAccepted(patientId, treatmentPlanId, true))}
        >
          <Check className="size-4" />
          Mark as accepted
        </Button>
      )}
    </div>
  );
}
