import { cache } from "react";
import { redirect } from "next/navigation";
import { getAdminProfile, type Profile } from "@/lib/auth";

export const requireAdmin = cache(async (): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getAdminProfile>>["user"]>;
  profile: Profile;
}> => {
  const { user, profile } = await getAdminProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
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
