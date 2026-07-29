"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { policyHtmlToText, sanitizePolicyHtml } from "@/lib/policy-html";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const SHORT_CODE_RE = /^[A-Za-z0-9]{4,16}$/;
const MAX_TITLE_LENGTH = 160;
const MAX_HTML_LENGTH = 2_000_000;

function editUrl(shortCode: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `/policies/${encodeURIComponent(shortCode)}/edit?${query.toString()}`;
}

export async function updateDocumentPolicy(formData: FormData) {
  await requireAdmin();

  const shortCode = String(formData.get("short_code") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const rawHtml = String(formData.get("content_html") || "");

  if (!SHORT_CODE_RE.test(shortCode)) {
    redirect("/policies?error=invalid-code");
  }

  if (!title) {
    redirect(editUrl(shortCode, { error: "标题不能为空" }));
  }

  if (title.length > MAX_TITLE_LENGTH) {
    redirect(
      editUrl(shortCode, {
        error: `标题不能超过 ${MAX_TITLE_LENGTH} 个字符`,
      })
    );
  }

  if (!rawHtml.trim()) {
    redirect(editUrl(shortCode, { error: "协议正文不能为空" }));
  }

  if (rawHtml.length > MAX_HTML_LENGTH) {
    redirect(editUrl(shortCode, { error: "协议正文过大，无法保存" }));
  }

  const contentHtml = sanitizePolicyHtml(rawHtml);
  const contentText = policyHtmlToText(contentHtml);

  if (!contentText) {
    redirect(editUrl(shortCode, { error: "协议正文没有有效文字" }));
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    redirect(
      editUrl(shortCode, {
        error: "后台未配置 SUPABASE_SERVICE_ROLE_KEY，无法保存",
      })
    );
  }

  const { data, error } = await admin
    .from("document_policy_links")
    .update({
      title,
      content_html: contentHtml,
      content_text: contentText,
    })
    .eq("short_code", shortCode)
    .select("short_code")
    .maybeSingle();

  if (error) {
    redirect(editUrl(shortCode, { error: `保存失败：${error.message}` }));
  }

  if (!data) {
    redirect(editUrl(shortCode, { error: "未找到对应的隐私协议" }));
  }

  revalidatePath("/policies");
  revalidatePath(`/policies/${shortCode}/edit`);
  redirect(editUrl(shortCode, { saved: "1" }));
}
