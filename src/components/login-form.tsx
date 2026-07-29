"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ALLOWED_ADMIN_EMAIL = "wangmiao@dxyx6888.com";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: ALLOWED_ADMIN_EMAIL,
        password,
      });
      if (signErr) {
        setError(signErr.message);
        setLoading(false);
        return;
      }

      const signedInEmail = String(data.user?.email || "").trim().toLowerCase();
      if (signedInEmail !== ALLOWED_ADMIN_EMAIL) {
        await supabase.auth.signOut();
        setError("该账号无权进入管理后台。");
        setLoading(false);
        return;
      }

      router.refresh();
      router.push(nextPath.startsWith("/") ? nextPath : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">管理员登录</CardTitle>
        <CardDescription>
          仅允许 wangmiao@dxyx6888.com 登录管理后台。
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">管理员邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              readOnly
              value={ALLOWED_ADMIN_EMAIL}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中…" : "登录"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
