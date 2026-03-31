import { AdminHeader } from "@/components/admin-header";
import { VisitsLogClient, type VisitRow } from "@/components/visits-log-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";

export default async function VisitsPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("page_visit_logs")
    .select(
      "id, created_at, path, url, page_type, referrer, user_agent, ip_masked, visitor_key, is_logged_in, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <>
        <AdminHeader title="访问日志" email={profile.email} />
        <main className="flex-1 p-6">
          <p className="text-sm text-red-600">加载失败：{error.message}</p>
        </main>
      </>
    );
  }

  const userIds = [
    ...new Set(
      (logs ?? [])
        .map((l) => l.user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const emailMap = new Map<string, string | null>();
  if (userIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of profs ?? []) {
      emailMap.set(p.id, p.email);
    }
  }

  const rows: VisitRow[] = (logs ?? []).map((l) => ({
    id: l.id,
    created_at: l.created_at,
    path: l.path,
    url: l.url,
    page_type: l.page_type,
    referrer: l.referrer,
    user_agent: l.user_agent,
    ip_masked: l.ip_masked,
    visitor_key: l.visitor_key,
    is_logged_in: l.is_logged_in,
    user_email: l.user_id ? emailMap.get(l.user_id) ?? null : null,
  }));

  return (
    <>
      <AdminHeader title="访问日志" email={profile.email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>最近访问</CardTitle>
            <CardDescription>
              列表与详情仅显示 ip_masked，不展示完整 IP。前台埋点请写入脱敏字段与
              ip_hash。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisitsLogClient rows={rows} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
