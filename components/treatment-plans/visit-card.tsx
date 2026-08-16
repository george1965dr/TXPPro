"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BoardItem } from "./board-state";

interface VisitCardProps {
  item: BoardItem;
  onRemove: () => void;
  onFeeChange: (fee: number) => void;
}

export function VisitCard({ item, onRemove, onFeeChange }: VisitCardProps) {
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
      className={`relative rounded-md border bg-card p-2 text-sm ${isPending ? "opacity-60" : "cursor-grab"}`}
    >
      <button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
      >
        <X className="size-3" />
      </button>
      <p className="pr-3 font-medium">{item.adaCode}</p>
      {item.toothNumber !== null && (
        <p className="text-xs font-medium text-primary">
          Tooth #{item.toothNumber}
          {item.surfaces.length > 0 && ` — ${item.surfaces.join("")}`}
        </p>
      )}
      <p className="mb-1 text-xs text-muted-foreground">{item.description}</p>
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
          className="ml-auto h-6 w-24 text-right text-xs"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setFeeDraft(String(item.fee));
            setEditingFee(true);
          }}
          className="w-full text-right text-xs text-muted-foreground hover:text-foreground"
          title="Click to edit fee"
        >
          ${item.fee.toLocaleString()}
        </button>
      )}
    </div>
  );
}
