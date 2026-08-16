"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseProcedureForm(formData: FormData) {
  const adaCode = formData.get("ada_code");
  const description = formData.get("description");
  const fee = formData.get("fee");
  const toothRequired = formData.get("tooth_required") === "on";

  if (typeof adaCode !== "string" || !adaCode.trim()) {
    throw new Error("ADA code is required.");
  }
  if (typeof description !== "string" || !description.trim()) {
    throw new Error("Description is required.");
  }
  const feeValue = typeof fee === "string" ? Number(fee) : NaN;
  if (!Number.isFinite(feeValue) || feeValue < 0) {
    throw new Error("Fee must be a positive number.");
  }

  return {
    ada_code: adaCode.trim().toUpperCase(),
    description: description.trim(),
    fee: feeValue,
    tooth_required: toothRequired,
  };
}

export async function createProcedure(formData: FormData) {
  const values = parseProcedureForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("procedures").insert(values);
  if (error) throw new Error(error.message);

  revalidatePath("/procedures");
}

export async function updateProcedure(procedureId: string, formData: FormData) {
  const values = parseProcedureForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("procedures").update(values).eq("id", procedureId);
  if (error) throw new Error(error.message);

  revalidatePath("/procedures");
}

export async function deleteProcedure(procedureId: string) {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("treatment_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("procedure_id", procedureId);
  if (countError) throw new Error(countError.message);
  if (count && count > 0) {
    throw new Error(
      `This code is used on ${count} treatment plan item${count === 1 ? "" : "s"} and can't be deleted.`,
    );
  }

  const { error } = await supabase.from("procedures").delete().eq("id", procedureId);
  if (error) throw new Error(error.message);

  revalidatePath("/procedures");
}
