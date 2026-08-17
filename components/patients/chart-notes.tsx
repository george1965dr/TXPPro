"use client";

import { useRef, useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateChartNotes } from "@/app/actions/patients";

export function ChartNotes({ patientId, initialNotes }: { patientId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const lastSaved = useRef(initialNotes);
  const [, startTransition] = useTransition();

  function commit() {
    if (notes === lastSaved.current) return;
    lastSaved.current = notes;
    startTransition(() => updateChartNotes(patientId, notes));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="chart-notes">Notes</Label>
      <Textarea
        id="chart-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={commit}
        rows={4}
        className="w-full resize-y"
        placeholder="Anything that can't be charted on the odontogram - occlusion, patient preferences, etc."
      />
    </div>
  );
}
