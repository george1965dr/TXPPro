"use client";

import { useRef, useState, useTransition } from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { addPatientMedia, deletePatientMedia } from "@/app/actions/media";
import { uploadMediaFile } from "./upload";
import { groupByDate, newMediaItem, type MediaItem } from "./media-state";
import { MediaTile } from "./media-tile";
import { MediaDetail } from "./media-detail";

interface MediaGalleryProps {
  patientId: string;
  initialItems: MediaItem[];
}

export function MediaGallery({ patientId, initialItems }: MediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setIsUploading(true);
    for (const file of Array.from(files)) {
      try {
        const uploaded = await uploadMediaFile(patientId, file);
        const row = await addPatientMedia(patientId, uploaded.type, uploaded.storagePath, uploaded.durationSeconds);
        setItems((prev) => [newMediaItem(row.id, uploaded.type, uploaded.storagePath, uploaded.durationSeconds, uploaded.objectUrl), ...prev]);
      } catch (err) {
        console.error("Failed to upload media file", err);
      }
    }
    setIsUploading(false);
  }

  function handleDelete(mediaId: string) {
    const target = items.find((item) => item.id === mediaId);
    if (!target) return;
    setItems((prev) => prev.filter((item) => item.id !== mediaId));
    setExpandedId(null);
    startTransition(async () => {
      await deletePatientMedia(patientId, mediaId, target.storagePath);
    });
  }

  const expandedItem = items.find((item) => item.id === expandedId) ?? null;
  const groups = groupByDate(items);

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed p-6 text-center",
          isDragOver && "border-primary bg-accent/40",
        )}
      >
        <FolderOpen className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isUploading ? "Uploading…" : "Drag photos or videos here, or click to choose files"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        {groups.length === 0 && <p className="text-sm text-muted-foreground">No photos or videos yet.</p>}
        {groups.map((group) => (
          <div key={group.date}>
            <p className="mb-1.5 text-xs text-muted-foreground">
              {group.date === new Date().toISOString().slice(0, 10) ? "Today" : group.date}
            </p>
            <div className="flex flex-wrap gap-3">
              {group.items.map((item) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  selected={item.id === expandedId}
                  onSelect={() => setExpandedId(item.id === expandedId ? null : item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {expandedItem && (
        <MediaDetail item={expandedItem} onDelete={() => handleDelete(expandedItem.id)} onClose={() => setExpandedId(null)} />
      )}
    </div>
  );
}
