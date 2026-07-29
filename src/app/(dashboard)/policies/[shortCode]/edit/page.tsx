import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/guards";
import { sanitizePolicyHtml } from "@/lib/policy-html";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { updateDocumentPolicy } from "@/app/(dashboard)/policies/actions";
import { PolicyEditForm } from "@/app/(dashboard)/policies/policy-edit-form";

const SHORT_CODE_RE = /^[A-Za-z0-9]{4,16}$/;

type PageProps = {
  params: Promise<{ shortCode: string }>;
  searchParams: Promise<{
    saved?: string | string[];
    error?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditPolicyPage({ params, searchParams }: PageProps) {
  const { profile } = await requireAdmin();
  const { shortCode } = await params;
  const query = await searchParams;

  if (!SHORT_CODE_RE.test(shortCode)) notFound();

  const admin = createServiceRoleClient();
  if (!admin) {
    return (
      <>
        <AdminHeader title="编辑隐私协议" email={profile.email} />
        <main className="flex-1 p-6">
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-red-900">后台配置缺失</CardTitle>
              <CardDescription className="text-red-800/90">
                未配置 SUPABASE_SERVICE_ROLE_KEY，暂时无法读取和保存协议内容。
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  const { data: row, error } = await admin
    .from("document_policy_links")
    .select("short_code, title, content_html, created_at")
    .eq("short_code", shortCode)
    .maybeSingle();

  if (error) {
    return (
      <>
        <AdminHeader title="编辑隐私协议" email={profile.email} />
        <main className="flex-1 p-6">
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader>
              <CardTitle className="text-red-900">读取失败</CardTitle>
              <CardDescription className="text-red-800/90">
                {error.message}
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  if (!row) notFound();

  const publicUrl = `https://privacy.hnchpower.cn/document-policy.html?id=${encodeURIComponent(shortCode)}`;
  const saved = firstParam(query.saved) === "1";
  const errorMessage = firstParam(query.error);

  return (
    <>
      <AdminHeader title="编辑隐私协议" email={profile.email} />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline">
            <Link href="/policies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回协议列表
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              查看公开页面
            </Link>
          </Button>
        </div>

        {saved ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            保存成功。公开链接保持不变，刷新公开页面即可看到最新内容。
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{row.title || "未命名隐私协议"}</CardTitle>
            <CardDescription>
              文档编号：<code className="rounded bg-zinc-100 px-1">{shortCode}</code>
              。保存后继续使用原审核链接，不会生成新地址。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PolicyEditForm
              shortCode={shortCode}
              initialTitle={row.title || "隐私协议文档"}
              initialHtml={sanitizePolicyHtml(row.content_html || "")}
              action={updateDocumentPolicy}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
