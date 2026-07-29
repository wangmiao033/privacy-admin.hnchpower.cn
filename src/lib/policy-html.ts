const BLOCK_BREAK_RE = /<\s*\/?\s*(p|div|section|article|header|footer|h[1-6]|li|tr|table|blockquote|pre)\b[^>]*>/gi;
const LINE_BREAK_RE = /<\s*br\s*\/?>/gi;
const TAG_RE = /<[^>]+>/g;

/**
 * 管理员编辑页与保存接口共用的基础 HTML 清理。
 * 正式展示页仍会再次执行自己的白名单清理，形成双层防护。
 */
export function sanitizePolicyHtml(input: string) {
  return String(input || "")
    .replace(
      /<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ""
    )
    .replace(
      /<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link|base)\b[^>]*\/?>/gi,
      ""
    )
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi,
      ' $1="#"'
    )
    .trim();
}

function decodeBasicEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCodePoint(value) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const value = Number.parseInt(code, 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : "";
    });
}

export function policyHtmlToText(input: string) {
  const sanitized = sanitizePolicyHtml(input);
  return decodeBasicEntities(
    sanitized
      .replace(LINE_BREAK_RE, "\n")
      .replace(BLOCK_BREAK_RE, "\n")
      .replace(TAG_RE, "")
  )
    .replace(/\r/g, "")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
