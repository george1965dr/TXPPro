"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPatient(formData: FormData) {
  const name = formData.get("name");
  const birthDate = formData.get("birth_date");
  const email = formData.get("email");

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Patient name is required.");
  }
  if (typeof birthDate !== "string" || !birthDate) {
    throw new Error("Birth date is required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      name: name.trim(),
      birth_date: birthDate,
      email: typeof email === "string" && email.trim() ? email.trim() : null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/patients");
  redirect(`/patients/${data.id}`);
}
