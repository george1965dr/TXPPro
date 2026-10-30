"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VisitCard } from "./visit-card";
import type { BoardItem } from "./board-state";

interface VisitColumnProps {
  label: string;
  items: BoardItem[];
  visitCount: number;
  onDropItem: (itemId: string) => void;
  onMoveItem: (itemId: string, appointmentNumber: number | null) => void;
  onRemoveItem: (itemId: string) => void;
  onFeeChange: (itemId: string, fee: number) => void;
}

export function VisitColumn({
  label,
  items,
  visitCount,
  onDropItem,
  onMoveItem,
  onRemoveItem,
  onFeeChange,
}: VisitColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.fee, 0);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const itemId = e.dataTransfer.getData("text/plain");
        if (itemId) onDropItem(itemId);
      }}
      className={cn(
        "flex min-h-[200px] flex-col rounded-2xl bg-foreground/[0.04] p-2.5 transition-colors",
        label === "Unscheduled" && "border border-dashed border-foreground/20",
        isOver && "bg-primary/10",
      )}
    >
      <p className="mb-2.5 flex items-baseline justify-between px-1 text-sm font-medium">
        {label}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">{items.length}</span>
      </p>
      <div className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => (
          <VisitCard
            key={item.id}
            item={item}
            visitCount={visitCount}
            onMove={(n) => onMoveItem(item.id, n)}
            onRemove={() => onRemoveItem(item.id)}
            onFeeChange={(fee) => onFeeChange(item.id, fee)}
          />
        ))}
      </div>
      <p className="mt-2 border-t border-foreground/10 px-1 pt-2 text-right text-xs text-muted-foreground tabular-nums">
        ${subtotal.toLocaleString()}
      </p>
    </div>
  );
}
