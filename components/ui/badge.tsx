import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-alt)] text-[var(--text-soft)]",
        success: "bg-[var(--success-bg)] text-[var(--success-text)] ring-1 ring-[var(--success-border)]",
        warning: "bg-[var(--warning-bg)] text-[var(--warning-text)] ring-1 ring-[var(--warning-border)]",
        danger: "bg-[var(--danger-bg)] text-[var(--danger-text)] ring-1 ring-[var(--danger-border)]",
        info: "bg-[var(--info-bg)] text-[var(--info-text)] ring-1 ring-[var(--info-border)]",
        outline: "bg-[var(--badge-outline-bg)] text-[var(--text-soft)] ring-1 ring-[var(--line-soft)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
