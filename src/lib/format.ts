import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "yyyy-MM-dd HH:mm:ss", { locale: zhCN });
  } catch {
    return "—";
  }
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "yyyy-MM-dd", { locale: zhCN });
  } catch {
    return "—";
  }
}

/** User-Agent 列表展示用摘要 */
export function summarizeUserAgent(ua: string | null | undefined, max = 72) {
  if (!ua) return "—";
  const t = ua.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
