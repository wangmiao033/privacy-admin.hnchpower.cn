import { createClient } from "@supabase/supabase-js";

/**
 * 仅服务端使用。必须在已校验管理员身份后调用。
 * 未配置 SUPABASE_SERVICE_ROLE_KEY 时返回 null。
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
