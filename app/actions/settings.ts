"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePracticeName(name: string) {
  const trimmed = name.trim();
  const supabase = await createClient();

  const { error } = await supabase
    .from("practice_settings")
    .upsert({ id: 1, name: trimmed, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
