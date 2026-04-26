"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "right",
  widthClass = "w-full sm:w-[460px]",
  closeLabel = "Close",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "right" | "left";
  widthClass?: string;
  closeLabel?: string;
}) {
  useEffect(() => {
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

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-[1px] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute top-0 bottom-0 bg-[var(--dialog-bg)] shadow-2xl flex flex-col transition-colors duration-200",
          widthClass,
          side === "right" ? "right-0" : "left-0",
        )}
      >
        <div className="flex items-center justify-between gap-4 px-5 h-[60px] border-b border-[var(--line-soft)] shrink-0">
          {title && <div className="text-[15px] font-semibold text-[var(--text-strong)] truncate">{title}</div>}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="h-8 w-8 rounded-lg hover:bg-[var(--surface-alt)] text-[var(--text-soft)] hover:text-[var(--text-strong)] flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
