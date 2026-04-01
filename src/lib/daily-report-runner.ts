import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  collectDailyReportMetrics,
  formatDailyReportHtml,
  formatDailyReportPlainText,
} from "@/lib/daily-report-data";
import {
  cleanupDailyReportJobLog,
  cleanupPageVisitLogs,
} from "@/lib/daily-report-cleanup";
import { sendMailSmtp } from "@/lib/email/smtp-send";
import {
  getDayBeforeYesterdayBoundsUtc,
  getLast7DaysBoundsUtc,
  getYesterdayBoundsUtc,
} from "@/lib/report-timezone";

export type RunDailyReportOptions = {
  /** 测试：跳过开关、去重与清理，不写 job 日志 */
  test?: boolean;
};

export async function runDailyReport(
  opts: RunDailyReportOptions = {}
): Promise<{ ok: boolean; message: string }> {
  if (!opts.test && process.env.DAILY_REPORT_ENABLED !== "true") {
    return { ok: true, message: "skipped: DAILY_REPORT_ENABLED is not true" };
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY 未配置" };
  }

  const tz = process.env.REPORT_TIMEZONE || "Asia/Shanghai";
  const yesterday = getYesterdayBoundsUtc(new Date(), tz);
  const last7 = getLast7DaysBoundsUtc(new Date(), tz);
  const dayBeforeYesterday = getDayBeforeYesterdayBoundsUtc(new Date(), tz);

  if (!opts.test) {
    const c1 = await cleanupDailyReportJobLog(svc);
    if (!c1.ok) {
      return { ok: false, message: `cleanup job log: ${c1.message}` };
    }
    const c2 = await cleanupPageVisitLogs(svc);
    if (!c2.ok) {
      return { ok: false, message: `cleanup visits: ${c2.message}` };
    }

    const { data: dup, error: dupErr } = await svc
      .from("daily_report_job_log")
      .select("id")
      .eq("report_date", yesterday.label)
      .eq("kind", "daily")
      .eq("status", "sent")
      .maybeSingle();

    if (!dupErr && dup) {
      return {
        ok: true,
        message: `skipped: already sent for ${yesterday.label}`,
      };
    }
  }

  const metrics = await collectDailyReportMetrics(
    svc,
    yesterday,
    last7,
    dayBeforeYesterday,
    tz
  );

  const to =
    process.env.DAILY_REPORT_TO || "wangmiao033@gmail.com";
  const prefix =
    process.env.DAILY_REPORT_SUBJECT_PREFIX || "[admin.hnchpower.cn]";
  const subject = opts.test
    ? `${prefix} 每日数据报告（测试） - ${metrics.reportDateLabel}`
    : `${prefix} 每日数据报告 - ${metrics.reportDateLabel}`;

  const send = await sendMailSmtp({
    to,
    subject,
    text: formatDailyReportPlainText(metrics),
    html: formatDailyReportHtml(metrics),
  });

  if (!opts.test) {
    const { error: logErr } = await svc.from("daily_report_job_log").insert({
      report_date: yesterday.label,
      kind: "daily",
      status: send.ok ? "sent" : "error",
      detail: send.ok ? null : send.message.slice(0, 500),
    });
    if (logErr) {
      return {
        ok: send.ok,
        message: send.ok
          ? `sent but job log insert failed: ${logErr.message}`
          : `${send.message}; log: ${logErr.message}`,
      };
    }
  }

  return send.ok
    ? { ok: true, message: opts.test ? "测试邮件已发送" : "日报已发送" }
    : { ok: false, message: send.message };
}
