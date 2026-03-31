import { AdminHeader } from "@/components/admin-header";
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
import { requireAdmin } from "@/lib/guards";
import {
  FOCUS_PAGE_GROUPS,
  countVisitsForPaths,
} from "@/lib/path-stats";
import { createClient } from "@/lib/supabase/server";
import {
  addDaysUtc,
  fetchDailySeries,
  fetchTopPaths,
  fetchVisitCounts,
  startOfUtcDay,
  utcNow,
} from "@/lib/visit-stats";

export default async function StatsPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const now = utcNow();
  const todayStart = startOfUtcDay(now);
  const tomorrow = addDaysUtc(todayStart, 1);
  const yesterdayStart = addDaysUtc(todayStart, -1);
  const weekAgo = addDaysUtc(todayStart, -7);

  const [today, yesterday, series, top, focusToday, focusWeek] =
    await Promise.all([
      fetchVisitCounts(supabase, todayStart, tomorrow),
      fetchVisitCounts(supabase, yesterdayStart, todayStart),
      fetchDailySeries(supabase, 7),
      fetchTopPaths(supabase, weekAgo, 25),
      Promise.all(
        FOCUS_PAGE_GROUPS.map((g) =>
          countVisitsForPaths(
            supabase,
            g.paths,
            todayStart.toISOString(),
            tomorrow.toISOString()
          )
        )
      ),
      Promise.all(
        FOCUS_PAGE_GROUPS.map((g) =>
          countVisitsForPaths(
            supabase,
            g.paths,
            weekAgo.toISOString(),
            tomorrow.toISOString()
          )
        )
      ),
    ]);

  return (
    <>
      <AdminHeader title="访问统计" email={profile.email} />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="今日 PV" value={today.pv} />
          <KpiCard title="今日 UV" value={today.uv} />
          <KpiCard title="昨日 PV" value={yesterday.pv} />
          <KpiCard title="昨日 UV" value={yesterday.uv} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>近 7 日 PV / UV 趋势</CardTitle>
            <CardDescription>UTC 日边界</CardDescription>
          </CardHeader>
          <CardContent>
            <StatsDualTrendChart data={series.series} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>重点页面 · 今日 PV</CardTitle>
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
                      <TableCell colSpan={2} className="text-zinc-500">
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
