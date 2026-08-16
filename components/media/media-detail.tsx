"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCapturedDate, formatDuration } from "@/lib/dental/media";
import type { MediaItem } from "./media-state";

interface MediaDetailProps {
  item: MediaItem;
  onRetag: (toothNumber: number | null) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function MediaDetail({ item, onRetag, onDelete, onClose }: MediaDetailProps) {
  return (
    <div className="flex gap-4 border-t pt-4">
      <div className="flex h-32 w-44 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {item.type === "photo" && item.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="size-full object-cover" />
        ) : item.type === "video" && item.url ? (
          <video src={item.url} controls className="size-full object-cover" />
        ) : null}
      </div>

      <div className="flex-1">
        <p className="mb-2 text-sm text-muted-foreground">
          Taken {formatCapturedDate(item.capturedAt)}
          {item.type === "video" && item.durationSeconds !== null && ` · ${formatDuration(item.durationSeconds)}`}
        </p>

        {item.type === "photo" && (
          <div className="mb-3 flex flex-col gap-1.5">
            <Label htmlFor="tooth-tag" className="text-xs text-muted-foreground">
              Tagged tooth
            </Label>
            <Input
              id="tooth-tag"
              type="number"
              min={1}
              max={32}
              defaultValue={item.toothNumber ?? ""}
              placeholder="e.g. 14"
              className="h-8 w-20 text-sm"
              onBlur={(e) => {
                const value = e.target.value.trim();
                const parsed = value ? Number(value) : null;
                onRetag(parsed && parsed >= 1 && parsed <= 32 ? parsed : null);
              }}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
