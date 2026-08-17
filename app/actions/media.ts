"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MediaType, PatientMedia } from "@/lib/types";

/**
 * Records a media row after the file has already been uploaded to Storage
 * from the browser (large photo/video files go straight to Storage, not
 * through this server action's payload).
 */
export async function addPatientMedia(
  patientId: string,
  type: MediaType,
  storagePath: string,
  durationSeconds: number | null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_media")
    .insert({
      patient_id: patientId,
      type,
      storage_path: storagePath,
      duration_seconds: durationSeconds,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
  return data as PatientMedia;
}

export async function deletePatientMedia(patientId: string, mediaId: string, storagePath: string) {
  const supabase = await createClient();

  await supabase.storage.from("patient-media").remove([storagePath]);

  const { error } = await supabase.from("patient_media").delete().eq("id", mediaId);
  if (error) throw new Error(error.message);

  revalidatePath(`/patients/${patientId}`);
}
