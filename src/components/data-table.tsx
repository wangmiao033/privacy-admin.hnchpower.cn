import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 统一表格容器：白底、圆角、边框（页面内可复用）
 */
export function DataTableShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-200 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}
