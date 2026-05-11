import { NextRequest } from "next/server";
import {
  assetAuthHeaders,
  getAssetManagerEnv,
  proxyAssetResponse,
  requireAssetAdmin,
} from "@/lib/asset-manager";

export async function GET(request: NextRequest) {
  const admin = await requireAssetAdmin();
  if (!admin.ok) {
    return Response.json({ ok: false, error: admin.message }, { status: admin.status });
  }

  try {
    const { apiBaseUrl, token } = getAssetManagerEnv();
    const url = new URL(request.url);
    const workerUrl = new URL(`${apiBaseUrl}/api/assets`);
    url.searchParams.forEach((value, key) => workerUrl.searchParams.set(key, value));
    const response = await fetch(workerUrl, {
      headers: assetAuthHeaders(token),
      cache: "no-store",
    });
    return proxyAssetResponse(response);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "素材列表读取失败" },
      { status: 500 }
    );
  }
}
