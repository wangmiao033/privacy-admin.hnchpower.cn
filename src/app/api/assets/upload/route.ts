import { NextRequest } from "next/server";
import {
  assetAuthHeaders,
  getAssetManagerEnv,
  proxyAssetResponse,
  requireAssetAdmin,
} from "@/lib/asset-manager";

export async function POST(request: NextRequest) {
  const admin = await requireAssetAdmin();
  if (!admin.ok) {
    return Response.json({ ok: false, error: admin.message }, { status: admin.status });
  }

  try {
    const { apiBaseUrl, token } = getAssetManagerEnv();
    const formData = await request.formData();
    const response = await fetch(`${apiBaseUrl}/api/assets/upload`, {
      method: "POST",
      headers: assetAuthHeaders(token),
      body: formData,
    });
    return proxyAssetResponse(response);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "素材上传失败" },
      { status: 500 }
    );
  }
}
