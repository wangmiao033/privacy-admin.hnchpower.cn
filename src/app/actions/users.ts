"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/guards";

export type UpdateUserResult = { ok: true } | { ok: false; message: string };

export async function updateUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<UpdateUserResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/users");
  return { ok: true };
}

export async function updateUserActive(
  userId: string,
  is_active: boolean
): Promise<UpdateUserResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/users");
  return { ok: true };
}

export async function updateUserPdfDownload(
  userId: string,
  can_download_pdf: boolean
): Promise<UpdateUserResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ can_download_pdf })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/users");
  return { ok: true };
}
