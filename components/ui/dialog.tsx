"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthCls =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-2xl bg-[var(--dialog-bg)] shadow-2xl transition-colors duration-200",
          widthCls,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-5 py-4">
          <div className="min-w-0">
            <div className="text-base font-semibold text-[var(--text-strong)]">{title}</div>
            {description && (
              <div className="mt-1 text-xs text-[var(--text-soft)]">{description}</div>
            )}
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-soft)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-strong)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--line-soft)] bg-[var(--surface-alt)]/60 px-5 py-3 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
