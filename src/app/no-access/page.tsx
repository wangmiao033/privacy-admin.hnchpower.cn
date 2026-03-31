import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileForUser, getSessionUser } from "@/lib/auth";

export default async function NoAccessPage() {
  const user = await getSessionUser();
  const profile = user ? await getProfileForUser(user.id) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100/60 px-4">
      <Card className="w-full max-w-md border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>无权限</CardTitle>
          <CardDescription>
            {!user
              ? "请先登录管理员账号。"
              : profile?.role !== "admin"
                ? "当前账号不是管理员（profiles.role ≠ admin）。"
                : !profile?.is_active
                  ? "管理员账号已被禁用。"
                  : "无法访问后台。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {!user ? (
            <Button asChild className="flex-1">
              <Link href="/login">去登录</Link>
            </Button>
          ) : (
            <form action={signOut} className="flex-1">
              <Button type="submit" variant="secondary" className="w-full">
                退出并重新登录
              </Button>
            </form>
          )}
          <Button variant="outline" asChild className="flex-1">
            <Link href="https://privacy.hnchpower.cn/" target="_blank" rel="noreferrer">
              返回前台
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
