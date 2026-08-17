"use client";

import { Button } from "@/components/ui/button";
import { formatCapturedDate, formatDuration } from "@/lib/dental/media";
import type { MediaItem } from "./media-state";

interface MediaDetailProps {
  item: MediaItem;
  onDelete: () => void;
  onClose: () => void;
}

export function MediaDetail({ item, onDelete, onClose }: MediaDetailProps) {
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
        <p className="mb-3 text-sm text-muted-foreground">
          Taken {formatCapturedDate(item.capturedAt)}
          {item.type === "video" && item.durationSeconds !== null && ` · ${formatDuration(item.durationSeconds)}`}
        </p>

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
