import type { SupabaseClient } from "@supabase/supabase-js";

export type DailyPoint = { day: string; pv: number; uv: number };

function startOfUtcDay(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}

function addDaysUtc(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function fetchVisitCounts(
  supabase: SupabaseClient,
  from: Date,
  to: Date
) {
  const { data, error } = await supabase.rpc("admin_visit_counts", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error || !data?.length) {
    return { pv: 0, uv: 0, error: error?.message };
  }
  const row = data[0] as { pv: number; uv: number };
  return { pv: Number(row.pv), uv: Number(row.uv), error: undefined };
}

export async function fetchTopPaths(
  supabase: SupabaseClient,
  from: Date,
  limit = 20
) {
  const { data, error } = await supabase.rpc("admin_top_paths", {
    p_from: from.toISOString(),
    p_limit: limit,
  });
  if (error) return { rows: [] as { path: string; cnt: number }[], error: error.message };
  const rows = (data ?? []) as { path: string; cnt: number }[];
  return {
    rows: rows.map((r) => ({ path: r.path, cnt: Number(r.cnt) })),
    error: undefined,
  };
}

export async function fetchDailySeries(supabase: SupabaseClient, days = 7) {
  const { data, error } = await supabase.rpc("admin_visit_daily_series", {
    p_days: days,
  });
  if (error) return { series: [] as DailyPoint[], error: error.message };
  const series = (data ?? []).map((r: { day: string; pv: number; uv: number }) => ({
    day: typeof r.day === "string" ? r.day : String(r.day),
    pv: Number(r.pv),
    uv: Number(r.uv),
  }));
  return { series, error: undefined };
}

export function utcNow() {
  return new Date();
}

export { startOfUtcDay, addDaysUtc };
