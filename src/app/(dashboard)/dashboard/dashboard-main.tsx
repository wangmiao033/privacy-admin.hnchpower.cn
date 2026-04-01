import { AdminHeader } from "@/components/admin-header";
import { AdminServiceRoleMissingCard } from "@/components/admin-service-role-missing";
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
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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

export async function DashboardMain({ email }: Props) {
  const supabaseUser = await createClient();
  const svc = createServiceRoleClient();

  const now = utcNow();
  const todayStart = startOfUtcDay(now);
  const tomorrow = addDaysUtc(todayStart, 1);
  const yesterdayStart = addDaysUtc(todayStart, -1);

  const [usersCount, newToday] = await Promise.all([
    supabaseUser.from("profiles").select("*", { count: "exact", head: true }),
    supabaseUser
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
  ]);

  const totalUsers = usersCount.count ?? 0;
  const newUsersToday = newToday.count ?? 0;

  if (!svc) {
    return (
      <>
        <AdminHeader title="仪表盘" email={email} />
        <main className="flex-1 space-y-6 p-6">
          <AdminServiceRoleMissingCard context="访问统计（PV/UV、趋势、热门页）" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="今日 PV" value="—" hint="需 SERVICE_ROLE" />
            <KpiCard title="今日 UV" value="—" hint="需 SERVICE_ROLE" />
            <KpiCard title="总用户数" value={totalUsers} />
            <KpiCard title="今日新增用户" value={newUsersToday} />
          </div>
        </main>
      </>
    );
  }

  const [today, yesterday, series, top] = await Promise.all([
    fetchVisitCountsSvc(svc, todayStart, tomorrow),
    fetchVisitCountsSvc(svc, yesterdayStart, todayStart),
    fetchDailySeriesSvc(svc, 7),
    fetchTopPathsSvc(svc, addDaysUtc(todayStart, -7), 12),
  ]);

  const visitRpcError =
    today.error || series.error || top.error
      ? [today.error, series.error, top.error].filter(Boolean).join("；")
      : null;

  return (
    <>
      <AdminHeader title="仪表盘" email={email} />
      <main className="flex-1 space-y-6 p-6">
        {visitRpcError ? (
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-red-900">访问统计加载异常</CardTitle>
              <CardDescription className="text-red-800/90">
                {visitRpcError}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-red-900/80">
              请确认已执行 migration{" "}
              <code className="rounded bg-red-100 px-1 text-xs">
                20260331000006_page_visit_logs_email_ua_svc_rpc.sql
              </code>
              。
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="今日 PV" value={today.pv} />
          <KpiCard title="今日 UV" value={today.uv} hint="按 visitor_key 去重" />
          <KpiCard title="总用户数" value={totalUsers} />
          <KpiCard title="今日新增用户" value={newUsersToday} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>近 7 日访问趋势（PV）</CardTitle>
            <CardDescription>按 UTC 日聚合 · service_role 读取</CardDescription>
          </CardHeader>
          <CardContent>
            {series.series.length === 0 && !visitRpcError ? (
              <p className="py-12 text-center text-sm text-zinc-500">
                近 7 日暂无访问数据
              </p>
            ) : (
              <DashboardTrendChart data={series.series} />
            )}
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
                      <TableCell colSpan={2} className="text-center text-zinc-500">
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
