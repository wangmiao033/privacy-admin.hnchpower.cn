/** 统计页重点页面：兼容带/不带尾部斜杠 */
export const FOCUS_PAGE_GROUPS = [
  { label: "首页 /", paths: ["/"] },
  {
    label: "隐私政策工具",
    paths: ["/tools/privacy-policy/", "/tools/privacy-policy"],
  },
  {
    label: "PDF 盖章工具",
    paths: ["/tools/pdf-seal/", "/tools/pdf-seal"],
  },
] as const;

export async function countVisitsForPaths(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  paths: readonly string[],
  fromIso: string,
  toIso: string
) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return 0;
  const { count, error } = await supabase
    .from("page_visit_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lt("created_at", toIso)
    .in("path", unique);
  if (error) return 0;
  return count ?? 0;
}
