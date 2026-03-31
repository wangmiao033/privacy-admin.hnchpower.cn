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
            <CardTitle>系统信息</CardTitle>
            <CardDescription>独立后台 · 首版占位</CardDescription>
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
            <Separator />
            <div>
              <div className="font-medium text-zinc-900">预留</div>
              <p className="mt-1 text-zinc-500">
                后续可在此扩展站点配置、功能开关、通知等。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
