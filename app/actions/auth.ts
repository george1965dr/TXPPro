"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(_prevState: string | undefined, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return "Enter your email and password.";
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // TODO: switch back to a generic message once initial setup is confirmed working -
    // Supabase's own error text is safe to show (no secrets) and much faster to debug with.
    return `Couldn't sign in: ${error.message}`;
  }

  redirect("/patients");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
