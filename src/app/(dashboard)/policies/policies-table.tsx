import Link from "next/link";
import { CalendarClock, ChevronDown, FileText, History } from "lucide-react";
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
import { PolicyDocumentsSearch } from "@/app/(dashboard)/policies/policy-documents-search";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

type Props = {
  email: string | null;
};

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof FileText;
}) {
  return (
    <Card className="rounded-2xl border-zinc-200/90 shadow-none">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-400">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export async function PoliciesTable({ email }: Props) {
  const supabase = await createClient();
  const admin = createServiceRoleClient();

  const logsResult = await supabase
    .from("policy_publish_logs")
    .select(
      "id, created_at, publish_time, user_id, email, company_name, app_name, publish_url"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const documentsResult = admin
    ? await admin
        .from("document_policy_links")
        .select("id, short_code, title, created_at")
        .order("created_at", { ascending: false })
        .limit(500)
    : {
        data: null,
        error: {
          message: "后台未配置 SUPABASE_SERVICE_ROLE_KEY，无法读取协议正文记录。",
        },
      };

  const documents = documentsResult.data ?? [];
  const logs = logsResult.data ?? [];
  const recentBoundary = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentDocuments = documents.filter((row) => {
    const time = new Date(row.created_at).getTime();
    return Number.isFinite(time) && time >= recentBoundary;
  }).length;
  const visibleLogs = logs.slice(0, 30);

  return (
    <>
      <AdminHeader
        title="隐私协议管理"
        email={email}
        description="用审核链接或文档编号快速定位，并直接修改已发布内容"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1480px] space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="协议总数"
              value={documents.length}
              note="当前可编辑的文档协议"
              icon={FileText}
            />
            <MetricCard
              label="近 30 天新增"
              value={recentDocuments}
              note="最近发布或新建的协议"
              icon={CalendarClock}
            />
            <MetricCard
              label="发布记录"
              value={logs.length}
              note="后台最近读取的发布日志"
              icon={History}
            />
          </section>

          <Card className="overflow-hidden rounded-2xl border-zinc-200/90 shadow-none">
            <CardHeader className="border-b border-zinc-100 bg-white px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-base">协议工作台</CardTitle>
                  <CardDescription className="mt-1">
                    先搜索，再打开或编辑。每页只显示 12 条，避免页面过长。
                  </CardDescription>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  保存后原审核链接不变
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              {documentsResult.error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {documentsResult.error.message}
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 py-16 text-center">
                  <FileText className="h-9 w-9 text-zinc-300" />
                  <p className="mt-3 text-sm font-medium text-zinc-700">暂无文档隐私协议</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    在前台“上传隐私协议文档”工具发布后，会在这里显示。
                  </p>
                </div>
              ) : (
                <PolicyDocumentsSearch documents={documents} />
              )}
            </CardContent>
          </Card>

          <details className="group overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-none">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                  <History className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">发布日志</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    默认收起，展开后查看最近 {visibleLogs.length} 条记录
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {logs.length} 条
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180" />
              </div>
            </summary>

            <div className="border-t border-zinc-100 p-5 sm:p-6">
              {logsResult.error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  发布日志读取失败：{logsResult.error.message}
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 py-12 text-center text-sm text-zinc-500">
                  暂无发布记录
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-zinc-50/80">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>发布时间</TableHead>
                          <TableHead>用户邮箱</TableHead>
                          <TableHead>公司名</TableHead>
                          <TableHead>应用名</TableHead>
                          <TableHead>发布链接</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleLogs.map((row) => {
                          const displayTime =
                            (row as { publish_time?: string | null }).publish_time ??
                            row.created_at;
                          return (
                            <TableRow key={row.id} className="hover:bg-zinc-50/70">
                              <TableCell className="whitespace-nowrap py-3 text-zinc-500">
                                {formatDateTime(displayTime)}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate py-3">
                                {row.email ?? "—"}
                              </TableCell>
                              <TableCell className="max-w-[160px] truncate py-3">
                                {row.company_name ?? "—"}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate py-3">
                                {row.app_name ?? "—"}
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate py-3">
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
                </div>
              )}
            </div>
          </details>
        </div>
      </main>
    </>
  );
}
