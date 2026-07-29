import { cache } from "react";
import { redirect } from "next/navigation";
import { getAdminProfile, type Profile } from "@/lib/auth";

const ALLOWED_ADMIN_EMAIL = "wangmiao@dxyx6888.com";

function normalizeEmail(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export const requireAdmin = cache(async (): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getAdminProfile>>["user"]>;
  profile: Profile;
}> => {
  const { user, profile } = await getAdminProfile();

  if (!user) {
    redirect("/login");
  }

  if (normalizeEmail(user.email) !== ALLOWED_ADMIN_EMAIL) {
    redirect("/no-access");
  }

  if (!profile) {
    redirect("/no-access");
  }

  if (normalizeEmail(profile.email) !== ALLOWED_ADMIN_EMAIL) {
    redirect("/no-access");
  }

  if (profile.role !== "admin") {
    redirect("/no-access");
  }

  if (!profile.is_active) {
    redirect("/no-access");
  }

  return { user, profile };
});
