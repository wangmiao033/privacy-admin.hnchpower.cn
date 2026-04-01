import { AdminHeader } from "@/components/admin-header";
import { AdminServiceRoleMissingCard } from "@/components/admin-service-role-missing";
import { KpiCard } from "@/components/kpi-card";
import { StatsDualTrendChart } from "@/components/stats-dual-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FOCUS_PAGE_GROUPS,
  countVisitsForPaths,
} from "@/lib/path-stats";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  fetchDailySeriesSvc,
  fetchTopPathsSvc,
  fetchVisitCountsSvc,
} from "@/lib/visit-stats-svc";
import {
  addDaysUtc,
  startOfUtcDay,
  utcNow,
} from "@/lib/visit-stats";

type Props = { email: string | null };

export async function StatsMain({ email }: Props) {
  const svc = createServiceRoleClient();

  if (!svc) {
    return (
      <>
        <AdminHeader title="访问统计" email={email} />
        <main className="flex-1 space-y-6 p-6">
          <AdminServiceRoleMissingCard context="访问统计页" />
        </main>
      </>
    );
  }

  const now = utcNow();
  const todayStart = startOfUtcDay(now);
  const tomorrow = addDaysUtc(todayStart, 1);
  const yesterdayStart = addDaysUtc(todayStart, -1);
  const weekAgo = addDaysUtc(todayStart, -7);

  const [today, yesterday, series, top, focusToday, focusWeek] =
    await Promise.all([
      fetchVisitCountsSvc(svc, todayStart, tomorrow),
      fetchVisitCountsSvc(svc, yesterdayStart, todayStart),
      fetchDailySeriesSvc(svc, 7),
      fetchTopPathsSvc(svc, weekAgo, 25),
      Promise.all(
        FOCUS_PAGE_GROUPS.map((g) =>
          countVisitsForPaths(
            svc,
            g.paths,
            todayStart.toISOString(),
            tomorrow.toISOString()
          )
        )
      ),
      Promise.all(
        FOCUS_PAGE_GROUPS.map((g) =>
          countVisitsForPaths(
            svc,
            g.paths,
            weekAgo.toISOString(),
            tomorrow.toISOString()
          )
        )
      ),
    ]);

  const visitErr =
    today.error || yesterday.error || series.error || top.error
      ? [today.error, yesterday.error, series.error, top.error]
          .filter(Boolean)
          .join("；")
      : null;

  return (
    <>
      <AdminHeader title="访问统计" email={email} />
      <main className="flex-1 space-y-6 p-6">
        {visitErr ? (
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-red-900">统计数据异常</CardTitle>
              <CardDescription className="text-red-800/90">
                {visitErr}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-red-900/80">
              请确认已执行{" "}
              <code className="rounded bg-red-100 px-1 text-xs">
                20260331000006_page_visit_logs_email_ua_svc_rpc.sql
              </code>
              。
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="今日 PV" value={today.pv} />
          <KpiCard title="今日 UV" value={today.uv} hint="按 visitor_key 去重" />
          <KpiCard title="昨日 PV" value={yesterday.pv} />
          <KpiCard title="昨日 UV" value={yesterday.uv} hint="按 visitor_key 去重" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>近 7 日 PV / UV 趋势</CardTitle>
            <CardDescription>UTC 日边界 · service_role</CardDescription>
          </CardHeader>
          <CardContent>
            {series.series.length === 0 && !visitErr ? (
              <p className="py-12 text-center text-sm text-zinc-500">
                近 7 日暂无访问数据
              </p>
            ) : (
              <StatsDualTrendChart data={series.series} />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>重点页面 · 今日 / 近 7 日 PV</CardTitle>
              <CardDescription>路径匹配前台主要入口</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>页面</TableHead>
                    <TableHead className="text-right">今日 PV</TableHead>
                    <TableHead className="text-right">近 7 日 PV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FOCUS_PAGE_GROUPS.map((g, i) => (
                    <TableRow key={g.label}>
                      <TableCell className="font-medium">{g.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {focusToday[i]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {focusWeek[i]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>热门页面（近 7 天）</CardTitle>
              <CardDescription>全站路径排行</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>路径</TableHead>
                    <TableHead className="text-right">PV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-zinc-500">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    top.rows.map((r) => (
                      <TableRow key={r.path}>
                        <TableCell className="max-w-[300px] truncate font-mono text-xs">
                          {r.path}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.cnt}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
