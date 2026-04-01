import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminServiceRoleMissingCard({ context }: { context: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="text-amber-900">缺少服务端密钥</CardTitle>
        <CardDescription className="text-amber-900/80">
          {context} 依赖环境变量{" "}
          <code className="rounded bg-amber-100 px-1 text-xs">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
         （仅服务端，勿暴露到浏览器）。请在 Vercel / 本地{" "}
          <code className="text-xs">.env.local</code> 中配置后重新部署。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-amber-900/90">
        <p>
          同时请在 Supabase 执行 migration{" "}
          <code className="rounded bg-amber-100 px-1 text-xs">
            20260331000006_page_visit_logs_email_ua_svc_rpc.sql
          </code>
          ，以创建仅 <code className="text-xs">service_role</code> 可调用的统计
          RPC。
        </p>
      </CardContent>
    </Card>
  );
}
