import { getAdminProfile } from "@/lib/auth";

export type AssetManagerEnv = {
  apiBaseUrl: string;
  token: string;
};

export async function requireAssetAdmin() {
  const { user, profile } = await getAdminProfile();
  if (!user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }
  return { ok: true as const, user, profile };
}

export function getAssetManagerEnv(): AssetManagerEnv {
  const apiBaseUrl = process.env.ASSET_MANAGER_API_BASE_URL?.replace(/\/+$/, "");
  const token = process.env.ASSET_MANAGER_TOKEN;
  if (!apiBaseUrl || !token) {
    throw new Error("素材管理环境变量未配置");
  }
  return { apiBaseUrl, token };
}

export function assetAuthHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function proxyAssetResponse(response: Response) {
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
    },
  });
}
