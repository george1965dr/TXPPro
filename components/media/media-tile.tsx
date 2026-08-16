"use client";

import { Camera, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/dental/media";
import type { MediaItem } from "./media-state";

interface MediaTileProps {
  item: MediaItem;
  selected: boolean;
  onSelect: () => void;
}

export function MediaTile({ item, selected, onSelect }: MediaTileProps) {
  const caption =
    item.type === "video"
      ? `Whole mouth${item.durationSeconds !== null ? ` · ${formatDuration(item.durationSeconds)}` : ""}`
      : item.toothNumber !== null
        ? `#${item.toothNumber}`
        : "Full arch";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-1"
    >
      <div
        className={cn(
          "flex size-16 items-center justify-center overflow-hidden rounded-md border bg-muted",
          selected && "outline outline-2 outline-offset-1 outline-primary",
        )}
      >
        {item.type === "photo" && item.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="size-full object-cover" />
        ) : item.type === "video" ? (
          <Video className="size-6 text-muted-foreground" />
        ) : (
          <Camera className="size-6 text-muted-foreground" />
        )}
      </div>
      <span className="text-[11px] text-muted-foreground">{caption}</span>
    </button>
  );
}
