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
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

export default async function PoliciesPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("policy_publish_logs")
    .select(
      "id, created_at, user_id, email, company_name, app_name, publish_url"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <>
        <AdminHeader title="发布记录" email={profile.email} />
        <main className="flex-1 p-6">
          <p className="text-sm text-red-600">加载失败：{error.message}</p>
          <p className="mt-2 text-sm text-zinc-600">
            若表尚未创建，请在 Supabase 执行{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">
              supabase/migrations/20260331000003_policy_publish_logs.sql
            </code>
            。
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="隐私政策发布记录" email={profile.email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>发布记录</CardTitle>
            <CardDescription>
              数据来自表{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                policy_publish_logs
              </code>
              。前台在用户发布成功后应插入一行（需登录用户 JWT；或使用服务端仅
              service_role 写入）。
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  {(logs ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-zinc-500">
                        暂无记录。请在前台接入插入逻辑。
                      </TableCell>
                    </TableRow>
                  ) : (
                    (logs ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap text-zinc-600">
                          {formatDateTime(row.created_at)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
