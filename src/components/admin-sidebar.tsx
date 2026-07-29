"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "概览",
    items: [{ href: "/dashboard", label: "仪表盘", icon: LayoutDashboard }],
  },
  {
    label: "站点数据",
    items: [
      { href: "/users", label: "用户管理", icon: Users },
      { href: "/stats", label: "访问统计", icon: BarChart3 },
      { href: "/visits", label: "访问日志", icon: ScrollText },
    ],
  },
  {
    label: "内容管理",
    items: [{ href: "/policies", label: "隐私协议", icon: FileText }],
  },
  {
    label: "系统",
    items: [{ href: "/settings", label: "设置", icon: Settings }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 lg:flex">
      <div className="border-b border-zinc-800 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-zinc-950 shadow-lg shadow-black/20">
            HN
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-wide text-white">
              隐私站点后台
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
              <ShieldCheck className="h-3 w-3" /> 管理员工作台
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <section key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-white text-zinc-950 shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-zinc-950" : "text-zinc-500 group-hover:text-zinc-200"
                      )}
                    />
                    <span>{label}</span>
                    {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-zinc-950" /> : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <Link
          href="https://privacy.hnchpower.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <span>打开前台网站</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <p className="px-3 pt-2 text-[10px] text-zinc-600">admin.hnchpower.cn</p>
      </div>
    </aside>
  );
}
