import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchVisitCountsSvc } from "@/lib/visit-stats-svc";

export type DailyReportMetrics = {
  reportDateLabel: string;
  yesterdayNewUsers: number;
  yesterdayNewPublishes: number;
  yesterdayPv: number;
  yesterdayUv: number;
  last7NewUsers: number;
  last7NewPublishes: number;
  last7Pv: number;
  last7Uv: number;
  errors: string[];
};

export async function collectDailyReportMetrics(
  svc: SupabaseClient,
  yesterday: { label: string; start: Date; end: Date },
  last7: { start: Date; end: Date }
): Promise<DailyReportMetrics> {
  const errors: string[] = [];

  const [
    yUsers,
    yPub,
    yVisit,
    wUsers,
    wPub,
    wVisit,
  ] = await Promise.all([
    svc
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday.start.toISOString())
      .lt("created_at", yesterday.end.toISOString()),
    svc
      .from("policy_publish_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday.start.toISOString())
      .lt("created_at", yesterday.end.toISOString()),
    fetchVisitCountsSvc(svc, yesterday.start, yesterday.end),
    svc
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last7.start.toISOString())
      .lt("created_at", last7.end.toISOString()),
    svc
      .from("policy_publish_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last7.start.toISOString())
      .lt("created_at", last7.end.toISOString()),
    fetchVisitCountsSvc(svc, last7.start, last7.end),
  ]);

  if (yUsers.error) errors.push(`profiles(yesterday): ${yUsers.error.message}`);
  if (yPub.error) errors.push(`policy_publish_logs(yesterday): ${yPub.error.message}`);
  if (yVisit.error) errors.push(`visit(yesterday): ${yVisit.error}`);
  if (wUsers.error) errors.push(`profiles(7d): ${wUsers.error.message}`);
  if (wPub.error) errors.push(`policy_publish_logs(7d): ${wPub.error.message}`);
  if (wVisit.error) errors.push(`visit(7d): ${wVisit.error}`);

  return {
    reportDateLabel: yesterday.label,
    yesterdayNewUsers: yUsers.count ?? 0,
    yesterdayNewPublishes: yPub.count ?? 0,
    yesterdayPv: yVisit.pv,
    yesterdayUv: yVisit.uv,
    last7NewUsers: wUsers.count ?? 0,
    last7NewPublishes: wPub.count ?? 0,
    last7Pv: wVisit.pv,
    last7Uv: wVisit.uv,
    errors,
  };
}

export function formatDailyReportPlainText(m: DailyReportMetrics): string {
  const lines = [
    `数据日期：${m.reportDateLabel}`,
    "",
    "一、用户数据",
    `- 昨日新增注册用户：${m.yesterdayNewUsers}`,
    "",
    "二、发布记录",
    `- 昨日新增发布记录：${m.yesterdayNewPublishes}`,
    "",
    "三、访问数据",
    `- 昨日 PV：${m.yesterdayPv}`,
    `- 昨日 UV：${m.yesterdayUv}`,
    "",
    "四、最近 7 天概览",
    `- 7 日注册总数：${m.last7NewUsers}`,
    `- 7 日发布记录总数：${m.last7NewPublishes}`,
    `- 7 日总 PV：${m.last7Pv}`,
    `- 7 日总 UV：${m.last7Uv}`,
  ];
  if (m.errors.length) {
    lines.push("", "（部分指标查询异常）", ...m.errors.map((e) => `- ${e}`));
  }
  return lines.join("\n");
}

export function formatDailyReportHtml(m: DailyReportMetrics): string {
  const esc = (s: string | number) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const err =
    m.errors.length > 0
      ? `<p style="color:#b45309"><strong>部分查询异常</strong><br/>${m.errors.map((e) => esc(e)).join("<br/>")}</p>`
      : "";
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:14px;color:#18181b">
<p>数据日期：<strong>${esc(m.reportDateLabel)}</strong></p>
<h3 style="margin:1em 0 0.5em">一、用户数据</h3>
<ul><li>昨日新增注册用户：${esc(m.yesterdayNewUsers)}</li></ul>
<h3 style="margin:1em 0 0.5em">二、发布记录</h3>
<ul><li>昨日新增发布记录：${esc(m.yesterdayNewPublishes)}</li></ul>
<h3 style="margin:1em 0 0.5em">三、访问数据</h3>
<ul>
<li>昨日 PV：${esc(m.yesterdayPv)}</li>
<li>昨日 UV：${esc(m.yesterdayUv)}</li>
</ul>
<h3 style="margin:1em 0 0.5em">四、最近 7 天概览</h3>
<ul>
<li>7 日注册总数：${esc(m.last7NewUsers)}</li>
<li>7 日发布记录总数：${esc(m.last7NewPublishes)}</li>
<li>7 日总 PV：${esc(m.last7Pv)}</li>
<li>7 日总 UV：${esc(m.last7Uv)}</li>
</ul>
${err}
</body></html>`;
}
