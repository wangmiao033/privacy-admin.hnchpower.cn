import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "date-fns";
import { fetchVisitCountsSvc } from "@/lib/visit-stats-svc";
import { calendarDateLabelInTz } from "@/lib/report-timezone";

export type DailyByDayRow = {
  dateLabel: string;
  newUsers: number;
  newPublishes: number;
  pv: number;
  uv: number;
};

export type DailyReportMetrics = {
  reportDateLabel: string;
  yesterdayNewUsers: number;
  yesterdayNewPublishes: number;
  yesterdayPv: number;
  yesterdayUv: number;
  /** 较前一日对比用（报告日期的「前一日」= 日历上前天） */
  prevDayNewUsers: number;
  prevDayNewPublishes: number;
  prevDayPv: number;
  prevDayUv: number;
  last7NewUsers: number;
  last7NewPublishes: number;
  last7Pv: number;
  last7Uv: number;
  /** 与 last7 窗口对齐的按天明细（从最早一天到昨天，共 7 行） */
  last7ByDay: DailyByDayRow[];
  errors: string[];
};

/** 较前一日：增量与百分比；前一日为 0 时百分比为 null（展示 --） */
export function formatTrendSegment(
  current: number,
  previous: number
): { deltaStr: string; pctStr: string } {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  const deltaStr = `${sign}${delta}`;
  let pctStr = "--";
  if (previous !== 0) {
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.round(pct * 10) / 10;
    const ps = rounded > 0 ? "+" : "";
    pctStr = `${ps}${rounded}%`;
  }
  return { deltaStr, pctStr };
}

export async function collectDailyReportMetrics(
  svc: SupabaseClient,
  yesterday: { label: string; start: Date; end: Date },
  last7: { start: Date; end: Date },
  dayBeforeYesterday: { label: string; start: Date; end: Date },
  timeZone: string
): Promise<DailyReportMetrics> {
  const errors: string[] = [];

  const [
    yUsers,
    yPub,
    yVisit,
    pUsers,
    pPub,
    pVisit,
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
      .gte("created_at", dayBeforeYesterday.start.toISOString())
      .lt("created_at", dayBeforeYesterday.end.toISOString()),
    svc
      .from("policy_publish_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayBeforeYesterday.start.toISOString())
      .lt("created_at", dayBeforeYesterday.end.toISOString()),
    fetchVisitCountsSvc(svc, dayBeforeYesterday.start, dayBeforeYesterday.end),
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
  if (pUsers.error) errors.push(`profiles(prevDay): ${pUsers.error.message}`);
  if (pPub.error) errors.push(`policy_publish_logs(prevDay): ${pPub.error.message}`);
  if (pVisit.error) errors.push(`visit(prevDay): ${pVisit.error}`);
  if (wUsers.error) errors.push(`profiles(7d): ${wUsers.error.message}`);
  if (wPub.error) errors.push(`policy_publish_logs(7d): ${wPub.error.message}`);
  if (wVisit.error) errors.push(`visit(7d): ${wVisit.error}`);

  /** 按天：与 REPORT_TIMEZONE 日历日对齐，PV/UV 与汇总同用 admin_visit_counts_svc */
  const dayResults = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const dayStart = addDays(last7.start, i);
      const dayEnd = addDays(dayStart, 1);
      const label = calendarDateLabelInTz(dayStart, timeZone);
      return (async () => {
        const localErr: string[] = [];
        const [u, p, v] = await Promise.all([
          svc
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", dayStart.toISOString())
            .lt("created_at", dayEnd.toISOString()),
          svc
            .from("policy_publish_logs")
            .select("*", { count: "exact", head: true })
            .gte("created_at", dayStart.toISOString())
            .lt("created_at", dayEnd.toISOString()),
          fetchVisitCountsSvc(svc, dayStart, dayEnd),
        ]);
        if (u.error) localErr.push(`profiles(day ${label}): ${u.error.message}`);
        if (p.error) localErr.push(`policy(day ${label}): ${p.error.message}`);
        if (v.error) localErr.push(`visit(day ${label}): ${v.error}`);
        return {
          i,
          dateLabel: label,
          newUsers: u.count ?? 0,
          newPublishes: p.count ?? 0,
          pv: v.pv,
          uv: v.uv,
          localErr,
        };
      })();
    })
  );
  for (const d of dayResults) errors.push(...d.localErr);
  dayResults.sort((a, b) => a.i - b.i);
  const last7ByDay: DailyByDayRow[] = dayResults.map((d) => ({
    dateLabel: d.dateLabel,
    newUsers: d.newUsers,
    newPublishes: d.newPublishes,
    pv: d.pv,
    uv: d.uv,
  }));

  return {
    reportDateLabel: yesterday.label,
    yesterdayNewUsers: yUsers.count ?? 0,
    yesterdayNewPublishes: yPub.count ?? 0,
    yesterdayPv: yVisit.pv,
    yesterdayUv: yVisit.uv,
    prevDayNewUsers: pUsers.count ?? 0,
    prevDayNewPublishes: pPub.count ?? 0,
    prevDayPv: pVisit.pv,
    prevDayUv: pVisit.uv,
    last7NewUsers: wUsers.count ?? 0,
    last7NewPublishes: wPub.count ?? 0,
    last7Pv: wVisit.pv,
    last7Uv: wVisit.uv,
    last7ByDay,
    errors,
  };
}

function trendLine(label: string, current: number, previous: number): string {
  const { deltaStr, pctStr } = formatTrendSegment(current, previous);
  return `${label}：昨日 ${current}，较前一日 ${deltaStr}，变化 ${pctStr}`;
}

export function formatDailyReportPlainText(m: DailyReportMetrics): string {
  const lines = [
    `数据日期：${m.reportDateLabel}`,
    "",
    "一、用户数据（含趋势）",
    trendLine("新增注册", m.yesterdayNewUsers, m.prevDayNewUsers),
    "",
    "二、发布记录（含趋势）",
    trendLine("新增发布记录", m.yesterdayNewPublishes, m.prevDayNewPublishes),
    "",
    "三、访问数据（含趋势）",
    trendLine("PV", m.yesterdayPv, m.prevDayPv),
    trendLine("UV", m.yesterdayUv, m.prevDayUv),
    "",
    "四、最近 7 天概览（汇总）",
    `- 7 日注册总数：${m.last7NewUsers}`,
    `- 7 日发布记录总数：${m.last7NewPublishes}`,
    `- 7 日总 PV：${m.last7Pv}`,
    `- 7 日总 UV：${m.last7Uv}`,
    "",
    "五、最近 7 天按天（自早至晚）",
    "日期        注册  发布    PV      UV",
    ...m.last7ByDay.map(
      (r) =>
        `${r.dateLabel}  ${String(r.newUsers).padStart(4)}  ${String(r.newPublishes).padStart(4)}  ${String(r.pv).padStart(6)}  ${String(r.uv).padStart(6)}`
    ),
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

  const trendLi = (name: string, cur: number, prev: number) => {
    const { deltaStr, pctStr } = formatTrendSegment(cur, prev);
    return `<li>${esc(name)}：昨日 <strong>${esc(cur)}</strong>，较前一日 <strong>${esc(deltaStr)}</strong>，变化 <strong>${esc(pctStr)}</strong></li>`;
  };

  const tableRows = m.last7ByDay
    .map(
      (r) =>
        `<tr><td>${esc(r.dateLabel)}</td><td style="text-align:right">${esc(r.newUsers)}</td><td style="text-align:right">${esc(r.newPublishes)}</td><td style="text-align:right">${esc(r.pv)}</td><td style="text-align:right">${esc(r.uv)}</td></tr>`
    )
    .join("");

  const err =
    m.errors.length > 0
      ? `<p style="color:#b45309"><strong>部分查询异常</strong><br/>${m.errors.map((e) => esc(e)).join("<br/>")}</p>`
      : "";

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:14px;color:#18181b">
<p>数据日期：<strong>${esc(m.reportDateLabel)}</strong></p>
<h3 style="margin:1em 0 0.5em">一、用户数据（含趋势）</h3>
<ul>${trendLi("新增注册", m.yesterdayNewUsers, m.prevDayNewUsers)}</ul>
<h3 style="margin:1em 0 0.5em">二、发布记录（含趋势）</h3>
<ul>${trendLi("新增发布记录", m.yesterdayNewPublishes, m.prevDayNewPublishes)}</ul>
<h3 style="margin:1em 0 0.5em">三、访问数据（含趋势）</h3>
<ul>${trendLi("PV", m.yesterdayPv, m.prevDayPv)}${trendLi("UV", m.yesterdayUv, m.prevDayUv)}</ul>
<h3 style="margin:1em 0 0.5em">四、最近 7 天概览（汇总）</h3>
<ul>
<li>7 日注册总数：${esc(m.last7NewUsers)}</li>
<li>7 日发布记录总数：${esc(m.last7NewPublishes)}</li>
<li>7 日总 PV：${esc(m.last7Pv)}</li>
<li>7 日总 UV：${esc(m.last7Uv)}</li>
</ul>
<h3 style="margin:1em 0 0.5em">五、最近 7 天按天</h3>
<table style="border-collapse:collapse;font-size:13px" cellpadding="6" border="1">
<thead><tr><th>日期</th><th>注册</th><th>发布</th><th>PV</th><th>UV</th></tr></thead>
<tbody>${tableRows}</tbody>
</table>
${err}
</body></html>`;
}
