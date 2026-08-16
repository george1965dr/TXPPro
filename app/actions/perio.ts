"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PerioSite } from "@/lib/types";

type PerioSiteField = "probing_depth" | "recession" | "bleeding_on_probing";
type ToothStatusField = "mobility" | "furcation";

/**
 * Updates a single field on one tooth/site's periodontal row. Only the
 * changed field is sent (plus the conflict-key columns) - PostgREST's
 * merge-duplicates upsert leaves columns absent from the payload untouched,
 * so updating probing depth never clobbers a recession value on the same
 * site, and vice versa.
 */
export async function setPerioSite(
  patientId: string,
  toothNumber: number,
  site: PerioSite,
  field: PerioSiteField,
  value: number | boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("periodontal_measurements").upsert(
    {
      patient_id: patientId,
      tooth_number: toothNumber,
      site,
      [field]: value,
    },
    { onConflict: "patient_id,tooth_number,site" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function setToothPerioStatus(
  patientId: string,
  toothNumber: number,
  field: ToothStatusField,
  value: number,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("tooth_perio_status").upsert(
    {
      patient_id: patientId,
      tooth_number: toothNumber,
      [field]: value,
    },
    { onConflict: "patient_id,tooth_number" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}
