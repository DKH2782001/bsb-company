import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-alt)] text-[var(--text-soft)]",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
        danger: "bg-red-50 text-red-700 ring-1 ring-red-200/80",
        info: "bg-[var(--brand-50)] text-[var(--brand-700)] ring-1 ring-[var(--brand-100)]",
        outline: "bg-white text-[var(--text-soft)] ring-1 ring-[var(--line-soft)]",
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
