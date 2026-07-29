import Link from "next/link";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const PAGE_DESCRIPTIONS: Record<string, string> = {
  仪表盘: "站点核心数据与近期趋势",
  用户管理: "查看账号、权限和启用状态",
  访问统计: "分析访问量、页面和趋势",
  访问日志: "检索具体访问记录",
  素材管理: "管理站点上传与公共素材",
  隐私协议管理: "搜索、打开并编辑已发布协议",
  设置: "后台功能与通知配置",
};

type Props = {
  title: string;
  email?: string | null;
  description?: string;
};

export function AdminHeader({ title, email, description }: Props) {
  const subtitle = description || PAGE_DESCRIPTIONS[title] || "管理员工作台";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/dashboard" className="text-xs font-bold tracking-wide text-zinc-500">
              HN ADMIN
            </Link>
            <span className="text-zinc-300">/</span>
          </div>
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-950">{title}</h1>
          <p className="mt-0.5 hidden truncate text-xs text-zinc-500 sm:block">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="sm" className="hidden text-zinc-500 md:inline-flex">
            <Link href="https://privacy.hnchpower.cn/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              前台
            </Link>
          </Button>

          {email ? (
            <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
              <span className="max-w-[210px] truncate text-xs font-medium text-zinc-600">{email}</span>
            </div>
          ) : null}

          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="border-zinc-200 bg-white">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
