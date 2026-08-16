"use client";

import { createClient } from "@/lib/supabase/client";
import { isVideoFile } from "@/lib/dental/media";
import type { MediaType } from "@/lib/types";

export interface UploadResult {
  storagePath: string;
  type: MediaType;
  durationSeconds: number | null;
  objectUrl: string;
}

/**
 * Uploads a file straight from the browser to Supabase Storage - large
 * photo/video files never pass through the Next.js server. Returns an
 * object URL for immediate local preview, since a signed URL for a file
 * that was just uploaded in this session isn't needed yet.
 */
export async function uploadMediaFile(patientId: string, file: File): Promise<UploadResult> {
  const supabase = createClient();
  const type: MediaType = isVideoFile(file.name) ? "video" : "photo";
  const ext = file.name.split(".").pop() || (type === "video" ? "mp4" : "jpg");
  const path = `${patientId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("patient-media").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const objectUrl = URL.createObjectURL(file);
  const durationSeconds = type === "video" ? await readVideoDuration(objectUrl).catch(() => null) : null;

  return { storagePath: path, type, durationSeconds, objectUrl };
}

function readVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(Math.round(video.duration));
    video.onerror = () => reject(new Error("Could not read video metadata"));
    video.src = url;
  });
}
