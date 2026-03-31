import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-white hover:bg-zinc-800",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        outline: "text-zinc-700 border-zinc-200",
        success:
          "border-transparent bg-emerald-50 text-emerald-800 border-emerald-200",
        warning:
          "border-transparent bg-amber-50 text-amber-900 border-amber-200",
        destructive:
          "border-transparent bg-red-50 text-red-800 border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
