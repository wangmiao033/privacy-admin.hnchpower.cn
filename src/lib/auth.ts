import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  role: string;
  is_active: boolean;
  can_download_pdf: boolean;
  created_at: string;
  updated_at: string;
};

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfileForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, role, is_active, can_download_pdf, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export async function getAdminProfile() {
  const user = await getSessionUser();
  if (!user) return { user: null, profile: null };
  const profile = await getProfileForUser(user.id);
  return { user, profile };
}
