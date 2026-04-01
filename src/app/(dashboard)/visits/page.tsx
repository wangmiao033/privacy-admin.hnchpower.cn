import { Suspense } from "react";
import { VisitsLoadingShell } from "@/app/(dashboard)/visits/visits-loading-shell";
import { VisitsTable } from "@/app/(dashboard)/visits/visits-table";
import { requireAdmin } from "@/lib/guards";

export default async function VisitsPage() {
  const { profile } = await requireAdmin();

  return (
    <Suspense fallback={<VisitsLoadingShell email={profile.email} />}>
      <VisitsTable email={profile.email} />
    </Suspense>
  );
}
