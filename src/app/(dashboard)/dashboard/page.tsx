import { AdminHeader } from "@/components/admin-header";
import { DashboardTrendChart } from "@/components/dashboard-trend-chart";
import { KpiCard } from "@/components/kpi-card";
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
import { createClient } from "@/lib/supabase/server";
import {
  addDaysUtc,
  fetchDailySeries,
  fetchTopPaths,
  fetchVisitCounts,
  startOfUtcDay,
  utcNow,
} from "@/lib/visit-stats";

export default async function DashboardPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const now = utcNow();
  const todayStart = startOfUtcDay(now);
  const tomorrow = addDaysUtc(todayStart, 1);
  const yesterdayStart = addDaysUtc(todayStart, -1);

  const [today, yesterday, usersCount, newToday, series, top] =
    await Promise.all([
      fetchVisitCounts(supabase, todayStart, tomorrow),
      fetchVisitCounts(supabase, yesterdayStart, todayStart),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      fetchDailySeries(supabase, 7),
      fetchTopPaths(supabase, addDaysUtc(todayStart, -7), 12),
    ]);

  const totalUsers = usersCount.count ?? 0;
  const newUsersToday = newToday.count ?? 0;

  const rpcNote =
    today.error || series.error
      ? "若统计为 0，请确认已在 Supabase 执行 migrations（含 admin_visit RPC）。"
      : null;

  return (
    <>
      <AdminHeader title="仪表盘" email={profile.email} />
      <main className="flex-1 space-y-6 p-6">
        {rpcNote ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {rpcNote}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="今日 PV" value={today.pv} />
          <KpiCard title="今日 UV" value={today.uv} />
          <KpiCard title="总用户数" value={totalUsers} />
          <KpiCard title="今日新增用户" value={newUsersToday} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>近 7 日访问趋势（PV）</CardTitle>
            <CardDescription>按 UTC 日聚合</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardTrendChart data={series.series} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>昨日概览</CardTitle>
              <CardDescription>便于对比今日</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-8 text-sm">
              <div>
                <div className="text-zinc-500">昨日 PV</div>
                <div className="text-xl font-semibold tabular-nums">
                  {yesterday.pv}
                </div>
              </div>
              <div>
                <div className="text-zinc-500">昨日 UV</div>
                <div className="text-xl font-semibold tabular-nums">
                  {yesterday.uv}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>热门页面（近 7 天）</CardTitle>
              <CardDescription>按 PV 排序</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>路径</TableHead>
                    <TableHead className="text-right">次数</TableHead>
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
                        <TableCell className="max-w-[280px] truncate font-mono text-xs">
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
