"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string | string[];
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const errMsg = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-[var(--danger-text)]">*</span>}
        </Label>
      )}
      {children}
      {errMsg ? (
        <p className="text-xs text-[var(--danger-text)]">{errMsg}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--text-soft)]">{hint}</p>
      ) : null}
    </div>
  );
}

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 text-sm text-[var(--text-strong)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors duration-200",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
