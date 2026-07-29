import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
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
import { formatDateTime } from "@/lib/format";

type Props = {
  email: string | null;
};

export async function PoliciesTable({ email }: Props) {
  const supabase = await createClient();
  const admin = createServiceRoleClient();

  const logsResult = await supabase
    .from("policy_publish_logs")
    .select(
      "id, created_at, publish_time, user_id, email, company_name, app_name, publish_url"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const documentsResult = admin
    ? await admin
        .from("document_policy_links")
        .select("id, short_code, title, created_at")
        .order("created_at", { ascending: false })
        .limit(200)
    : {
        data: null,
        error: {
          message: "后台未配置 SUPABASE_SERVICE_ROLE_KEY，无法读取协议正文记录。",
        },
      };

  const documents = documentsResult.data ?? [];
  const logs = logsResult.data ?? [];

  return (
    <>
      <AdminHeader title="隐私协议管理" email={email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>已发布隐私协议</CardTitle>
            <CardDescription>
              可直接编辑标题和协议正文。保存后原审核链接保持不变，无需重新提交链接。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documentsResult.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {documentsResult.error.message}
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
                <p className="text-sm font-medium text-zinc-700">暂无文档隐私协议</p>
                <p className="mt-2 text-xs text-zinc-500">
                  在前台“上传隐私协议文档”工具发布后，会在这里显示。
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>文档编号</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>公开页面</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((row) => {
                      const publicUrl = `https://privacy.hnchpower.cn/document-policy.html?id=${encodeURIComponent(row.short_code)}`;
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="max-w-[300px] font-medium">
                            <span className="block truncate" title={row.title || ""}>
                              {row.title || "未命名隐私协议"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
                              {row.short_code}
                            </code>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-zinc-600">
                            {formatDateTime(row.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-1.5 h-4 w-4" />
                                打开
                              </Link>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm">
                              <Link href={`/policies/${encodeURIComponent(row.short_code)}/edit`}>
                                <Pencil className="mr-1.5 h-4 w-4" />
                                编辑内容
                              </Link>
                            </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>发布日志</CardTitle>
            <CardDescription>
              保留原有发布记录，便于核对发布人、应用名和发布时间。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsResult.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                发布日志读取失败：{logsResult.error.message}
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center text-sm text-zinc-500">
                暂无发布记录
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-200">
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
                    {logs.map((row) => {
                      const displayTime =
                        (row as { publish_time?: string | null }).publish_time ??
                        row.created_at;
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
                          <TableCell className="max-w-[260px] truncate">
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
