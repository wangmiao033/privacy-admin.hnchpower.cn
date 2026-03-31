import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getAllowedPolicyPublishOrigins,
  isAllowedPolicyPublishOrigin,
} from "@/lib/policy-publish-cors";

type Body = {
  user_email?: string;
  company_name?: string;
  app_name?: string;
  publish_url?: string;
  publish_time?: string;
};

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allow = origin && isAllowedPolicyPublishOrigin(origin) ? origin : "";
  const headers = new Headers();
  if (allow) {
    headers.set("Access-Control-Allow-Origin", allow);
    headers.set("Vary", "Origin");
  }
  headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "authorization, content-type"
  );
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isAllowedPolicyPublishOrigin(origin)) {
    return NextResponse.json(
      { error: "origin_not_allowed" },
      {
        status: 403,
        headers: {
          "Access-Control-Allow-Origin": "null",
        },
      }
    );
  }
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const h = corsHeaders(request);
  const origin = request.headers.get("origin");
  if (origin && !isAllowedPolicyPublishOrigin(origin)) {
    return NextResponse.json(
      { error: "origin_not_allowed", allowed: getAllowedPolicyPublishOrigins() },
      { status: 403, headers: Object.fromEntries(h.entries()) }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500, headers: Object.fromEntries(h.entries()) }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "missing_bearer_token" },
      { status: 401, headers: Object.fromEntries(h.entries()) }
    );
  }
  const token = authHeader.slice(7).trim();

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 401, headers: Object.fromEntries(h.entries()) }
    );
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: "service_role_not_configured",
        hint: "在后台环境变量中配置 SUPABASE_SERVICE_ROLE_KEY，或改由前台用登录用户 JWT 直连 Supabase insert（见 RLS policy_publish_logs_insert_own_user）。",
      },
      { status: 503, headers: Object.fromEntries(h.entries()) }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: Object.fromEntries(h.entries()) }
    );
  }

  const company_name = body.company_name?.trim() ?? "";
  const app_name = body.app_name?.trim() ?? "";
  const publish_url = body.publish_url?.trim() ?? "";

  if (!publish_url) {
    return NextResponse.json(
      { error: "publish_url_required" },
      { status: 400, headers: Object.fromEntries(h.entries()) }
    );
  }

  try {
    const u = new URL(publish_url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("bad protocol");
    }
  } catch {
    return NextResponse.json(
      { error: "publish_url_invalid" },
      { status: 400, headers: Object.fromEntries(h.entries()) }
    );
  }

  const email =
    (body.user_email?.trim() || user.email || null) as string | null;

  const publish_time = body.publish_time?.trim();
  const row: Record<string, unknown> = {
    user_id: user.id,
    email,
    company_name: company_name || null,
    app_name: app_name || null,
    publish_url,
  };
  if (publish_time) {
    row.publish_time = publish_time;
  }

  const { error: insErr } = await admin.from("policy_publish_logs").insert(row);

  if (insErr) {
    return NextResponse.json(
      { error: "insert_failed", message: insErr.message },
      { status: 500, headers: Object.fromEntries(h.entries()) }
    );
  }

  return NextResponse.json({ ok: true }, { headers: Object.fromEntries(h.entries()) });
}
