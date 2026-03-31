import { Suspense } from "react";
import { PoliciesLoadingShell } from "@/app/(dashboard)/policies/policies-loading-shell";
import { PoliciesTable } from "@/app/(dashboard)/policies/policies-table";
import { requireAdmin } from "@/lib/guards";

export default async function PoliciesPage() {
  const { profile } = await requireAdmin();

  return (
    <Suspense fallback={<PoliciesLoadingShell email={profile.email} />}>
      <PoliciesTable email={profile.email} />
    </Suspense>
  );
}
