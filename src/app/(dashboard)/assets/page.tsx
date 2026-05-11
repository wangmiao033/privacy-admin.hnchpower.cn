import { AdminHeader } from "@/components/admin-header";
import {
  AssetsManagerClient,
  type Asset,
} from "@/app/(dashboard)/assets/assets-manager-client";
import { requireAdmin } from "@/lib/guards";
import { assetAuthHeaders, getAssetManagerEnv } from "@/lib/asset-manager";

export default async function AssetsPage() {
  const { profile } = await requireAdmin();
  const initial = await fetchInitialAssets();

  return (
    <>
      <AdminHeader title="素材管理" email={profile.email} />
      <AssetsManagerClient initialAssets={initial.items} initialError={initial.error} />
    </>
  );
}

async function fetchInitialAssets(): Promise<{ items: Asset[]; error?: string }> {
  try {
    const { apiBaseUrl, token } = getAssetManagerEnv();
    const response = await fetch(`${apiBaseUrl}/api/assets?limit=500`, {
      headers: assetAuthHeaders(token),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return { items: data.items || [] };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : "素材清单读取失败",
    };
  }
}
