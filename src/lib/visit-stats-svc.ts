import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyPoint } from "@/lib/visit-stats";

/** 使用 service_role 客户端调用 *_svc RPC（仅服务端） */

export async function fetchVisitCountsSvc(
  supabase: SupabaseClient,
  from: Date,
  to: Date
) {
  const { data, error } = await supabase.rpc("admin_visit_counts_svc", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) {
    return { pv: 0, uv: 0, error: error.message };
  }
  if (!data?.length) {
    return { pv: 0, uv: 0, error: undefined };
  }
  const row = data[0] as { pv: number; uv: number };
  return { pv: Number(row.pv), uv: Number(row.uv), error: undefined as string | undefined };
}

export async function fetchTopPathsSvc(
  supabase: SupabaseClient,
  from: Date,
  limit = 20
) {
  const { data, error } = await supabase.rpc("admin_top_paths_svc", {
    p_from: from.toISOString(),
    p_limit: limit,
  });
  if (error) {
    return {
      rows: [] as { path: string; cnt: number }[],
      error: error.message,
    };
  }
  const rows = (data ?? []) as { path: string; cnt: number }[];
  return {
    rows: rows.map((r) => ({ path: r.path, cnt: Number(r.cnt) })),
    error: undefined as string | undefined,
  };
}

export async function fetchDailySeriesSvc(supabase: SupabaseClient, days = 7) {
  const { data, error } = await supabase.rpc("admin_visit_daily_series_svc", {
    p_days: days,
  });
  if (error) {
    return { series: [] as DailyPoint[], error: error.message };
  }
  const series = (data ?? []).map(
    (r: { day: string; pv: number; uv: number }) => ({
      day: typeof r.day === "string" ? r.day : String(r.day),
      pv: Number(r.pv),
      uv: Number(r.uv),
    })
  );
  return { series, error: undefined as string | undefined };
}
