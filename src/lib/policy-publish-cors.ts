/**
 * 允许调用「发布记录写入 API」的来源（前台域名）。
 * 环境变量：POLICY_PUBLISH_LOG_ALLOWED_ORIGINS，逗号分隔，例如：
 * https://privacy.hnchpower.cn,http://localhost:3000
 */
export function getAllowedPolicyPublishOrigins(): string[] {
  const raw = process.env.POLICY_PUBLISH_LOG_ALLOWED_ORIGINS ?? "";
  const fromEnv = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return ["https://privacy.hnchpower.cn", "http://localhost:3000"];
}

export function isAllowedPolicyPublishOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedPolicyPublishOrigins().includes(origin);
}
