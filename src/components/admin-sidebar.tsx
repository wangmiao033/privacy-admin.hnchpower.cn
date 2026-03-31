"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ScrollText,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const items = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/users", label: "用户管理", icon: Users },
  { href: "/stats", label: "访问统计", icon: BarChart3 },
  { href: "/visits", label: "访问日志", icon: ScrollText },
  { href: "/policies", label: "发布记录", icon: FileText },
  { href: "/settings", label: "设置", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/80">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-900">
          隐私站点后台
        </Link>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-70" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-[11px] leading-relaxed text-zinc-400">
        admin.hnchpower.cn
      </div>
    </aside>
  );
}
