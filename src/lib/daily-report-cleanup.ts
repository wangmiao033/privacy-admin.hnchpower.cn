import type { SupabaseClient } from "@supabase/supabase-js";

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** 删除过期访问日志（单次 DELETE，带时间条件，避免全表扫无索引） */
export async function cleanupPageVisitLogs(svc: SupabaseClient): Promise<{
  ok: boolean;
  message: string;
}> {
  const days = envInt("LOG_RETENTION_DAYS", 60);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const { error } = await svc
    .from("page_visit_logs")
    .delete()
    .lt("created_at", cutoff.toISOString());
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: `page_visit_logs older than ${days}d purged` };
}

/** 删除过期日报任务日志 */
export async function cleanupDailyReportJobLog(svc: SupabaseClient): Promise<{
  ok: boolean;
  message: string;
}> {
  const days = envInt("JOB_LOG_RETENTION_DAYS", 90);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const { error } = await svc
    .from("daily_report_job_log")
    .delete()
    .lt("created_at", cutoff.toISOString());
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: `daily_report_job_log older than ${days}d purged` };
}
