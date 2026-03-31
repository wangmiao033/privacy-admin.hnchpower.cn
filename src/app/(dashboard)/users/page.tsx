import { AdminHeader } from "@/components/admin-header";
import { UsersTable, type UserRow } from "@/components/users-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function UsersPage({ searchParams }: Props) {
  const { profile } = await requireAdmin();
  const { q } = await searchParams;
  const supabase = await createClient();
  const adminAuth = createServiceRoleClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, email, role, is_active, can_download_pdf, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const term = q?.trim();
  if (term) {
    query = query.ilike("email", `%${term}%`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return (
      <>
        <AdminHeader title="用户管理" email={profile.email} />
        <main className="flex-1 p-6">
          <p className="text-sm text-red-600">加载失败：{error.message}</p>
        </main>
      </>
    );
  }

  const signInMap = new Map<string, string | null>();
  if (adminAuth && profiles?.length) {
    const { data: list, error: listErr } = await adminAuth.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!listErr && list?.users) {
      for (const u of list.users) {
        signInMap.set(
          u.id,
          u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString() : null
        );
      }
    }
  }

  const rows: UserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    role: p.role,
    is_active: p.is_active,
    can_download_pdf: p.can_download_pdf,
    created_at: p.created_at,
    last_sign_in_at: signInMap.get(p.id) ?? null,
  }));

  return (
    <>
      <AdminHeader title="用户管理" email={profile.email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>
                搜索邮箱；可调整角色、启用状态与 PDF 下载权限。配置{" "}
                <code className="rounded bg-zinc-100 px-1 text-xs">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>{" "}
                后可显示最近登录时间（最多同步前 1000 名用户）。
              </CardDescription>
            </div>
            <form className="flex w-full max-w-md gap-2" method="get">
              <Input
                name="q"
                placeholder="搜索邮箱…"
                defaultValue={term ?? ""}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                搜索
              </Button>
              {term ? (
                <Button variant="outline" asChild>
                  <Link href="/users">清除</Link>
                </Button>
              ) : null}
            </form>
          </CardHeader>
          <CardContent>
            <UsersTable rows={rows} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
