import { Suspense } from "react";
import { DashboardLoadingShell } from "@/app/(dashboard)/dashboard/dashboard-loading-shell";
import { DashboardMain } from "@/app/(dashboard)/dashboard/dashboard-main";
import { requireAdmin } from "@/lib/guards";

export default async function DashboardPage() {
  const { profile } = await requireAdmin();

  return (
    <Suspense fallback={<DashboardLoadingShell email={profile.email} />}>
      <DashboardMain email={profile.email} />
    </Suspense>
  );
}
