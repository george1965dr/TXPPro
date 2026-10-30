"use client";

import { useEffect, useState } from "react";
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
  condition: ConditionId;
  onConditionChange: (condition: ConditionId) => void;
}

const SELECTABLE_CONDITIONS = CONDITIONS.filter((c) => c.group !== null && !c.proposedOnly);
const ERASE = CONDITIONS.find((c) => c.id === "erase")!;

const pill =
  "rounded-full px-3.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

/** Keyboard shortcuts must never fire while typing or while a dialog is open. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The odontogram's control bar. The Existing/Proposed switch is always shown
 * (switching back to Existing from the read-only Proposed view has to stay
 * reachable); the tool rows only apply to Existing, since proposed treatment
 * is authored on the kanban (see add-procedure-dialog.tsx), which draws its
 * own graphic.
 *
 * Shortcuts: 1-9 pick the nth tool in the open group, E picks Erase.
 */
export function ConditionPalette({ view, onViewChange, condition, onConditionChange }: ConditionPaletteProps) {
  const [activeGroup, setActiveGroup] = useState(CONDITION_GROUP_ORDER[0]);
  const editable = view === "existing";

  const items = SELECTABLE_CONDITIONS.filter((c) => c.group === activeGroup);
  const activeTool = CONDITIONS.find((c) => c.id === condition);

  useEffect(() => {
    if (!editable) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      if (e.key.toLowerCase() === "e") {
        onConditionChange("erase");
        return;
      }
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < items.length) {
        onConditionChange(items[index].id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editable, items, onConditionChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {editable ? (
          <p aria-live="polite" className="text-sm">
            <span className="text-muted-foreground">Active tool </span>
            <span className="font-medium">{activeTool?.label}</span>
          </p>
        ) : (
          <span />
        )}

        <div role="group" aria-label="Chart layer" className="flex rounded-full bg-foreground/[0.07] p-1">
          <button
            type="button"
            aria-pressed={view === "existing"}
            onClick={() => onViewChange("existing")}
            className={cn(
              pill,
              "py-1",
              view === "existing"
                ? "bg-primary font-medium text-primary-foreground"
                : "text-foreground/75 hover:text-foreground",
            )}
          >
            Existing
          </button>
          <button
            type="button"
            aria-pressed={view === "proposed"}
            onClick={() => onViewChange("proposed")}
            className={cn(
              pill,
              "py-1",
              view === "proposed"
                ? "bg-proposed font-medium text-proposed-foreground"
                : "text-foreground/75 hover:text-foreground",
            )}
          >
            Proposed
          </button>
        </div>
      </div>

      {editable ? (
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="Condition groups" className="flex flex-wrap gap-1.5">
            {CONDITION_GROUP_ORDER.map((group) => (
              <button
                key={group}
                type="button"
                aria-pressed={activeGroup === group}
                onClick={() => setActiveGroup(group)}
                className={cn(
                  pill,
                  activeGroup === group
                    ? "bg-foreground/10 font-medium text-foreground"
                    : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                {CONDITION_GROUP_LABEL[group]}
              </button>
            ))}
          </div>

          <div role="group" aria-label="Chart tools" className="flex flex-wrap items-center gap-2">
            <ToolButton
              label={ERASE.label}
              hint="E"
              selected={condition === "erase"}
              onClick={() => onConditionChange("erase")}
            />
            <span aria-hidden className="mx-1 h-5 w-px bg-foreground/15" />
            {items.map((c, i) => (
              <ToolButton
                key={c.id}
                label={c.label}
                hint={String(i + 1)}
                selected={condition === c.id}
                onClick={() => onConditionChange(c.id)}
              />
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

function ToolButton({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-keyshortcuts={hint}
      onClick={onClick}
      className={cn(
        pill,
        "flex items-center gap-2 border",
        selected
          ? "border-transparent bg-navy font-medium text-navy-foreground"
          : "border-foreground/15 bg-white/60 text-foreground hover:bg-white dark:bg-white/5 dark:hover:bg-white/10",
      )}
    >
      {label}
      <span aria-hidden className={cn("text-xs tabular-nums", selected ? "opacity-80" : "text-muted-foreground")}>
        {hint}
      </span>
    </button>
  );
}
