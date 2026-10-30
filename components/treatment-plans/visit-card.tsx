"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BoardItem } from "./board-state";

interface VisitCardProps {
  item: BoardItem;
  visitCount: number;
  onMove: (appointmentNumber: number | null) => void;
  onRemove: () => void;
  onFeeChange: (fee: number) => void;
}

export function VisitCard({ item, visitCount, onMove, onRemove, onFeeChange }: VisitCardProps) {
  const [editingFee, setEditingFee] = useState(false);
  const [feeDraft, setFeeDraft] = useState(String(item.fee));
  // Not yet synced to a real row - dragging it would schedule an id the
  // server doesn't know about. Settles once the add action resolves.
  const isPending = item.id.startsWith("pending-");

  function commitFee() {
    const next = Number(feeDraft);
    if (Number.isFinite(next) && next >= 0 && next !== item.fee) onFeeChange(next);
    setEditingFee(false);
  }

  return (
    <div
      draggable={!isPending}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id);
        e.currentTarget.style.opacity = "0.4";
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      className={`relative rounded-xl border border-foreground/[0.06] bg-white/85 p-3 text-sm shadow-[0_1px_2px_oklch(0.35_0.08_262/0.08),0_6px_16px_-8px_oklch(0.35_0.08_262/0.14)] dark:border-white/10 dark:bg-white/[0.07] dark:shadow-none ${isPending ? "opacity-60" : "cursor-grab"}`}
    >
      <button
        type="button"
        aria-label={`Remove ${item.adaCode}${item.toothNumber !== null ? ` tooth ${item.toothNumber}` : ""}`}
        onClick={onRemove}
        className="absolute top-0 right-0 flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <X className="size-3.5" />
      </button>
      <p className="pr-6 font-medium">{item.adaCode}</p>
      {item.toothNumber !== null && (
        <p className="text-xs font-medium text-primary">
          Tooth #{item.toothNumber}
          {item.surfaces.length > 0 && ` — ${item.surfaces.join("")}`}
        </p>
      )}
      <p className="mb-1 text-xs text-muted-foreground">{item.description}</p>
      <div className="flex items-center gap-1">
        <select
          aria-label={`Move ${item.adaCode}${item.toothNumber !== null ? ` tooth ${item.toothNumber}` : ""} to visit`}
          value={item.appointmentNumber ?? ""}
          onChange={(e) => onMove(e.target.value === "" ? null : Number(e.target.value))}
          disabled={isPending}
          className="h-6 min-w-0 flex-1 rounded border border-transparent bg-transparent px-0.5 text-xs text-muted-foreground outline-none hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">Unscheduled</option>
          {Array.from({ length: visitCount }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Visit {n}
            </option>
          ))}
        </select>
      {editingFee ? (
        <Input
          autoFocus
          type="number"
          min={0}
          step="0.01"
          value={feeDraft}
          onChange={(e) => setFeeDraft(e.target.value)}
          onBlur={commitFee}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitFee();
            if (e.key === "Escape") {
              setFeeDraft(String(item.fee));
              setEditingFee(false);
            }
          }}
          className="h-6 w-24 shrink-0 text-right text-xs"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setFeeDraft(String(item.fee));
            setEditingFee(true);
          }}
          className="shrink-0 rounded px-1 text-right text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          title="Click to edit fee"
        >
          ${item.fee.toLocaleString()}
        </button>
      )}
      </div>
    </div>
  );
}
