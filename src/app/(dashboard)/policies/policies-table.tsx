import { AdminHeader } from "@/components/admin-header";
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
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

type Props = {
  email: string | null;
};

export async function PoliciesTable({ email }: Props) {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("policy_publish_logs")
    .select(
      "id, created_at, publish_time, user_id, email, company_name, app_name, publish_url"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <>
        <AdminHeader title="隐私政策发布记录" email={email} />
        <main className="flex-1 space-y-6 p-6">
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-red-900">加载失败</CardTitle>
              <CardDescription className="text-red-800/90">
                {error.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-red-900/80">
              <p>
                请确认已在 Supabase 执行 migrations（含{" "}
                <code className="rounded bg-red-100 px-1 text-xs">
                  policy_publish_logs
                </code>
                ）。若刚增加{" "}
                <code className="rounded bg-red-100 px-1 text-xs">
                  publish_time
                </code>{" "}
                列，请执行{" "}
                <code className="rounded bg-red-100 px-1 text-xs">
                  20260331000005_policy_publish_logs_publish_time_rls.sql
                </code>
                。
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const rows = logs ?? [];

  return (
    <>
      <AdminHeader title="隐私政策发布记录" email={email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>发布记录</CardTitle>
            <CardDescription>
              数据来自{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                policy_publish_logs
              </code>
              。前台在<strong>发布成功之后</strong>写入：可直连 Supabase（须登录且{" "}
              <code className="text-xs">user_id = auth.uid()</code>
              ），或调用后台{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                POST /api/ingest/policy-publish-log
              </code>{" "}
             （需配置{" "}
              <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>
              与 CORS）。详见仓库{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                examples/policy-publish-log.frontend.ts
              </code>
              。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
                <p className="text-sm font-medium text-zinc-700">暂无发布记录</p>
                <p className="mt-2 max-w-md text-xs text-zinc-500">
                  用户在前台成功发布隐私政策后才会出现数据。请在前台发布成功回调中写入日志；发布失败时不要调用写入接口。
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>发布时间</TableHead>
                      <TableHead>用户邮箱</TableHead>
                      <TableHead>公司名</TableHead>
                      <TableHead>应用名</TableHead>
                      <TableHead>发布链接</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const displayTime =
                        (row as { publish_time?: string | null })
                          .publish_time ?? row.created_at;
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap text-zinc-600">
                            {formatDateTime(displayTime)}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate">
                            {row.email ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate">
                            {row.company_name ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate">
                            {row.app_name ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate">
                            {row.publish_url ? (
                              <Link
                                href={row.publish_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {row.publish_url}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
