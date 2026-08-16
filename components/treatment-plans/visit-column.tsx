"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VisitCard } from "./visit-card";
import type { BoardItem } from "./board-state";

interface VisitColumnProps {
  label: string;
  items: BoardItem[];
  onDropItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onFeeChange: (itemId: string, fee: number) => void;
}

export function VisitColumn({ label, items, onDropItem, onRemoveItem, onFeeChange }: VisitColumnProps) {
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
        "flex min-h-[180px] flex-col rounded-md bg-muted/40 p-2",
        isOver && "bg-accent/60",
      )}
    >
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => (
          <VisitCard
            key={item.id}
            item={item}
            onRemove={() => onRemoveItem(item.id)}
            onFeeChange={(fee) => onFeeChange(item.id, fee)}
          />
        ))}
      </div>
      <p className="mt-2 border-t pt-2 text-right text-xs text-muted-foreground">
        ${subtotal.toLocaleString()}
      </p>
    </div>
  );
}
