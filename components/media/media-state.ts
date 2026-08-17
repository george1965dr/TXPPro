import { todayDateString } from "@/lib/dental/media";
import type { MediaType, PatientMedia } from "@/lib/types";

export interface MediaItem {
  id: string;
  type: MediaType;
  capturedAt: string;
  durationSeconds: number | null;
  storagePath: string;
  url: string | null;
}

export function fromRow(row: PatientMedia, url: string | null): MediaItem {
  return {
    id: row.id,
    type: row.type,
    capturedAt: row.captured_at,
    durationSeconds: row.duration_seconds,
    storagePath: row.storage_path,
    url,
  };
}

export interface MediaGroup {
  date: string;
  items: MediaItem[];
}

export function groupByDate(items: MediaItem[]): MediaGroup[] {
  const order: string[] = [];
  const map = new Map<string, MediaItem[]>();

  for (const item of items) {
    if (!map.has(item.capturedAt)) {
      map.set(item.capturedAt, []);
      order.push(item.capturedAt);
    }
    map.get(item.capturedAt)!.push(item);
  }

  return order.map((date) => ({ date, items: map.get(date)! }));
}

export function newMediaItem(
  id: string,
  type: MediaType,
  storagePath: string,
  durationSeconds: number | null,
  url: string,
): MediaItem {
  return {
    id,
    type,
    capturedAt: todayDateString(),
    durationSeconds,
    storagePath,
    url,
  };
}
