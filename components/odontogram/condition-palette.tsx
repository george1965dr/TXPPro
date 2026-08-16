"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CONDITIONS,
  CONDITION_GROUP_LABEL,
  CONDITION_GROUP_ORDER,
  type ConditionId,
} from "@/lib/dental/conditions";
import type { ChartLayer } from "@/lib/types";

interface ConditionPaletteProps {
  view: ChartLayer;
  onViewChange: (view: ChartLayer) => void;
  isSaving: boolean;
  condition: ConditionId;
  onConditionChange: (condition: ConditionId) => void;
}

const SELECTABLE_CONDITIONS = CONDITIONS.filter((c) => c.group !== null && !c.proposedOnly);
const ERASE = CONDITIONS.find((c) => c.id === "erase")!;

/**
 * The odontogram's control bar: the Existing/Proposed view toggle and save
 * indicator are always shown (switching back to Existing from a read-only
 * Proposed view has to stay reachable); the erase button and condition
 * grid only apply to Existing, since proposed treatment is authored on the
 * kanban now (see add-procedure-dialog.tsx), which draws its own graphic.
 */
export function ConditionPalette({
  view,
  onViewChange,
  isSaving,
  condition,
  onConditionChange,
}: ConditionPaletteProps) {
  const [activeGroup, setActiveGroup] = useState(CONDITION_GROUP_ORDER[0]);
  const editable = view === "existing";

  const items = SELECTABLE_CONDITIONS.filter((c) => c.group === activeGroup);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {editable && (
          <button
            type="button"
            onClick={() => onConditionChange("erase")}
            className={cn(
              "rounded-md border px-2.5 py-1 text-sm",
              condition === "erase"
                ? "border-foreground/40 bg-accent font-medium"
                : "border-border bg-transparent text-muted-foreground hover:bg-accent/50",
            )}
          >
            {ERASE.label}
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex overflow-hidden rounded-md border">
            <button
              type="button"
              onClick={() => onViewChange("existing")}
              className={cn(
                "px-3 py-1.5 text-sm",
                view === "existing"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-accent",
              )}
            >
              Existing
            </button>
            <button
              type="button"
              onClick={() => onViewChange("proposed")}
              className={cn(
                "px-3 py-1.5 text-sm",
                view === "proposed"
                  ? "bg-destructive text-white"
                  : "bg-transparent text-muted-foreground hover:bg-accent",
              )}
            >
              Proposed
            </button>
          </div>
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

      {editable ? (
        <div className="grid grid-cols-[130px_1fr] gap-3 rounded-md border p-2">
          <div className="flex flex-col gap-0.5">
            {CONDITION_GROUP_ORDER.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-left text-sm",
                  activeGroup === group
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                {CONDITION_GROUP_LABEL[group]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1 border-l pl-3">
            {items.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onConditionChange(c.id)}
                className={cn(
                  "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-sm",
                  condition === c.id
                    ? "border-foreground/40 bg-accent font-medium"
                    : "border-border bg-transparent text-muted-foreground hover:bg-accent/50",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Proposed treatment is authored from the Sequence tab&apos;s kanban - this is a
          read-only picture of what&apos;s currently proposed.
        </p>
      )}
    </div>
  );
}
