import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100/60 px-4">
      <Suspense
        fallback={
          <div className="h-48 w-full max-w-md animate-pulse rounded-lg bg-zinc-200" />
        }
      >
        <LoginForm />
      </Suspense>
      <p className="mt-8 max-w-md text-center text-xs text-zinc-500">
        独立后台 · 与前台 privacy.hnchpower.cn 分仓部署
      </p>
    </div>
  );
}
