import { Suspense } from "react";
import { StatsLoadingShell } from "@/app/(dashboard)/stats/stats-loading-shell";
import { StatsMain } from "@/app/(dashboard)/stats/stats-main";
import { requireAdmin } from "@/lib/guards";

export default async function StatsPage() {
  const { profile } = await requireAdmin();

  return (
    <Suspense fallback={<StatsLoadingShell email={profile.email} />}>
      <StatsMain email={profile.email} />
    </Suspense>
  );
}
