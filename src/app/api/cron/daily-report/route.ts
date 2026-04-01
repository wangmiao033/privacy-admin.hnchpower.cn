import { NextRequest, NextResponse } from "next/server";
import { runDailyReport } from "@/lib/daily-report-runner";

export const dynamic = "force-dynamic";

/** 必须配置 CRON_SECRET；调用方带 Authorization: Bearer <CRON_SECRET>（Vercel Cron 在配置该 env 时会自动附加） */
function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Vercel Cron：每天 1:00 UTC ≈ 北京时间 9:00（无夏令时）
 * 手动 / 外部 cron：需带 Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const test = request.nextUrl.searchParams.get("test") === "1";
  const result = await runDailyReport({ test });

  return NextResponse.json({
    ok: result.ok,
    message: result.message,
    test,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
