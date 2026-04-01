import { AdminHeader } from "@/components/admin-header";
import { AdminServiceRoleMissingCard } from "@/components/admin-service-role-missing";
import { VisitsLogClient, type VisitRow } from "@/components/visits-log-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Props = { email: string | null };

type LogRow = {
  id: string;
  created_at: string;
  path: string;
  url: string | null;
  page_type: string | null;
  referrer: string | null;
  user_agent: string | null;
  ua: string | null;
  email: string | null;
  ip_masked: string | null;
  visitor_key: string | null;
  is_logged_in: boolean;
  user_id: string | null;
};

export async function VisitsTable({ email }: Props) {
  const svc = createServiceRoleClient();

  if (!svc) {
    return (
      <>
        <AdminHeader title="访问日志" email={email} />
        <main className="flex-1 space-y-6 p-6">
          <AdminServiceRoleMissingCard context="访问日志列表" />
        </main>
      </>
    );
  }

  const { data: logs, error } = await svc
    .from("page_visit_logs")
    .select(
      "id, created_at, path, url, page_type, referrer, user_agent, ua, email, ip_masked, visitor_key, is_logged_in, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <>
        <AdminHeader title="访问日志" email={email} />
        <main className="flex-1 space-y-6 p-6">
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-red-900">加载失败</CardTitle>
              <CardDescription className="text-red-800/90">
                {error.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-red-900/80">
              若提示列不存在，请在 Supabase 执行{" "}
              <code className="rounded bg-red-100 px-1 text-xs">
                20260331000006_page_visit_logs_email_ua_svc_rpc.sql
              </code>
              （增加 email / ua 列）。
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const list = (logs ?? []) as LogRow[];

  const userIds = [
    ...new Set(list.map((l) => l.user_id).filter((id): id is string => Boolean(id))),
  ];

  const emailMap = new Map<string, string | null>();
  if (userIds.length) {
    const supabaseUser = await createClient();
    const { data: profs } = await supabaseUser
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of profs ?? []) {
      emailMap.set(p.id, p.email);
    }
  }

  const rows: VisitRow[] = list.map((l) => {
    const uaMerged = (l.ua && l.ua.trim()) || l.user_agent || null;
    const emailMerged =
      (l.email && l.email.trim()) ||
      (l.user_id ? emailMap.get(l.user_id) ?? null : null);
    return {
      id: l.id,
      created_at: l.created_at,
      path: l.path,
      url: l.url,
      page_type: l.page_type,
      referrer: l.referrer,
      user_agent: uaMerged,
      ip_masked: l.ip_masked,
      visitor_key: l.visitor_key,
      is_logged_in: l.is_logged_in,
      user_email: emailMerged,
    };
  });

  return (
    <>
      <AdminHeader title="访问日志" email={email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>最近访问</CardTitle>
            <CardDescription>
              按时间倒序（最新 200 条）· 使用 service_role 读取。列表展示{" "}
              <code className="text-xs">ip_masked</code>；UA 优先{" "}
              <code className="text-xs">ua</code> 列，否则{" "}
              <code className="text-xs">user_agent</code>。邮箱优先埋点{" "}
              <code className="text-xs">email</code>，否则 profiles。
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
