/**
 * 前台「隐私政策发布成功」后写入 policy_publish_logs 的两种写法。
 * 复制到 privacy.hnchpower.cn 项目在发布成功的回调里调用；发布失败时不要调用。
 *
 * 前置：
 * 1. Supabase 已执行 migration 20260331000005（publish_time + RLS user_id = auth.uid()）
 * 2. 方案 B 需在后台 Vercel 配置 SUPABASE_SERVICE_ROLE_KEY 与 POLICY_PUBLISH_LOG_ALLOWED_ORIGINS
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PolicyPublishPayload = {
  user_email?: string;
  company_name?: string;
  app_name?: string;
  publish_url: string;
  /** ISO 8601；省略则由数据库默认 now() */
  publish_time?: string;
};

/**
 * 方案 A：前台已用 Supabase Auth 登录，浏览器持有 session。
 * 使用 anon key 的 Supabase 客户端，在发布成功后 insert。
 * RLS 要求：user_id 必须等于 auth.uid()。
 */
export async function logPolicyPublishDirect(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  payload: PolicyPublishPayload
) {
  const { error } = await supabase.from("policy_publish_logs").insert({
    user_id: userId,
    email: payload.user_email ?? userEmail ?? null,
    company_name: payload.company_name ?? null,
    app_name: payload.app_name ?? null,
    publish_url: payload.publish_url,
    ...(payload.publish_time
      ? { publish_time: payload.publish_time }
      : {}),
  });
  return { error };
}

/**
 * 方案 B：调用独立后台的 ingest API（服务端用 service_role 写入，不暴露密钥到浏览器）。
 * 请求需携带当前用户的 access_token（与 Supabase 项目一致）。
 */
export async function logPolicyPublishViaAdminApi(
  adminSiteOrigin: string,
  accessToken: string,
  payload: PolicyPublishPayload
) {
  const res = await fetch(
    `${adminSiteOrigin.replace(/\/$/, "")}/api/ingest/policy-publish-log`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );
  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    return {
      error: new Error(
        json.message ?? json.error ?? `HTTP ${res.status}`
      ),
    };
  }
  return { error: null as null };
}

/**
 * 使用示例（伪代码）：
 *
 * const { data: { session } } = await supabase.auth.getSession();
 * if (!session) return;
 * // ... 执行发布业务，仅当发布成功时：
 * await logPolicyPublishDirect(supabase, session.user.id, session.user.email, {
 *   company_name,
 *   app_name,
 *   publish_url: finalUrl,
 *   publish_time: new Date().toISOString(),
 * });
 */
