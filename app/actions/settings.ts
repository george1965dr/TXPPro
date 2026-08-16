"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePracticeSettings(name: string, address: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("practice_settings").upsert({
    id: 1,
    name: name.trim(),
    address: address.trim(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
