import { NextRequest } from "next/server";
import {
  assetAuthHeaders,
  getAssetManagerEnv,
  proxyAssetResponse,
  requireAssetAdmin,
} from "@/lib/asset-manager";

type RouteContext = {
  params: Promise<{ assetId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await requireAssetAdmin();
  if (!admin.ok) {
    return Response.json({ ok: false, error: admin.message }, { status: admin.status });
  }

  try {
    const { assetId } = await context.params;
    const { apiBaseUrl, token } = getAssetManagerEnv();
    const response = await fetch(`${apiBaseUrl}/api/assets/${encodeURIComponent(assetId)}`, {
      method: "PATCH",
      headers: {
        ...assetAuthHeaders(token),
        "Content-Type": "application/json",
      },
      body: await request.text(),
    });
    return proxyAssetResponse(response);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "素材更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await requireAssetAdmin();
  if (!admin.ok) {
    return Response.json({ ok: false, error: admin.message }, { status: admin.status });
  }

  try {
    const { assetId } = await context.params;
    const { apiBaseUrl, token } = getAssetManagerEnv();
    const response = await fetch(`${apiBaseUrl}/api/assets/${encodeURIComponent(assetId)}`, {
      method: "DELETE",
      headers: assetAuthHeaders(token),
    });
    return proxyAssetResponse(response);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "素材删除失败" },
      { status: 500 }
    );
  }
}
