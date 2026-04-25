import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 py-2 text-sm text-[var(--text-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
        "placeholder:text-[var(--text-soft)]/75",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
