import { DailyReportTestButton } from "@/components/daily-report-test-button";
import { AdminHeader } from "@/components/admin-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/guards";

export default async function SettingsPage() {
  const { profile } = await requireAdmin();

  return (
    <>
      <AdminHeader title="设置" email={profile.email} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>每日数据报告（邮件）</CardTitle>
            <CardDescription>
              定时任务路径{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                GET /api/cron/daily-report
              </code>
              ，需请求头{" "}
              <code className="text-xs">Authorization: Bearer CRON_SECRET</code>
              。Vercel 请在环境变量中设置{" "}
              <code className="text-xs">CRON_SECRET</code>，Cron 会自动附带。
              调度见仓库根目录{" "}
              <code className="text-xs">vercel.json</code>（默认每日 01:00 UTC ≈
              北京时间 9:00）。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-700">
            <p>
              数据来自现有表{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">profiles</code>、
              <code className="rounded bg-zinc-100 px-1 text-xs">
                policy_publish_logs
              </code>
              ，以及统计 RPC{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">
                admin_visit_counts_svc
              </code>
              （与仪表盘 / 统计页一致）。邮件仅汇总数字，无附件。
            </p>
            <Separator />
            <div>
              <div className="font-medium text-zinc-900">测试发送</div>
              <p className="mt-1 text-zinc-500">
                不写去重日志、不跑数据清理；需已配置 SMTP 与{" "}
                <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>。
              </p>
              <div className="mt-3">
                <DailyReportTestButton />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>独立后台</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-700">
            <div>
              <div className="font-medium text-zinc-900">部署域名（规划）</div>
              <p className="mt-1">admin.hnchpower.cn</p>
            </div>
            <Separator />
            <div>
              <div className="font-medium text-zinc-900">前台站点</div>
              <p className="mt-1">https://privacy.hnchpower.cn/</p>
            </div>
            <Separator />
            <div>
              <div className="font-medium text-zinc-900">当前登录</div>
              <p className="mt-1">{profile.email ?? profile.id}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
