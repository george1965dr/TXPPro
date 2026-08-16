"use client";

import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { UPPER_ARCH, LOWER_ARCH } from "@/lib/dental/tooth-geometry";

interface ToothFilterProps {
  toothsWithPhotos: Set<number>;
  selectedTooth: number | null;
  onSelect: (tooth: number | null) => void;
}

function Row({
  teeth,
  toothsWithPhotos,
  selectedTooth,
  onSelect,
}: ToothFilterProps & { teeth: number[] }) {
  return (
    <div className="flex justify-center gap-1">
      {teeth.map((tooth) => {
        const active = selectedTooth === tooth;
        const hasPhoto = toothsWithPhotos.has(tooth);
        return (
          <button
            key={tooth}
            type="button"
            onClick={() => onSelect(active ? null : tooth)}
            className={cn(
              "relative flex size-7 items-center justify-center rounded-md border text-[11px]",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/50 text-muted-foreground",
            )}
          >
            {tooth}
            {hasPhoto && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full",
                  active ? "bg-primary-foreground" : "bg-primary",
                )}
              >
                <Camera className={cn("size-2", active ? "text-primary" : "text-primary-foreground")} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ToothFilter(props: ToothFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <Row {...props} teeth={UPPER_ARCH} />
      <Row {...props} teeth={LOWER_ARCH} />
    </div>
  );
}
