"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (input: Omit<Toast, "id">) => {
        if (typeof window !== "undefined") {
          // Fallback nếu chưa mount Toaster
          console.warn("[toast]", input.variant, input.title, input.description);
        }
      },
    };
  }
  return ctx;
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  error: <AlertTriangle className="h-4 w-4 text-red-600" />,
  info: <Info className="h-4 w-4 text-indigo-600" />,
};

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    (input) => {
      const id = ++idRef.current;
      const next: Toast = { id, ...input };
      setItems((prev) => [...prev, next]);
      const timeout = input.variant === "error" ? 6000 : 4000;
      setTimeout(() => dismiss(id), timeout);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3 shadow-lg",
              t.variant === "success" && "border-emerald-200",
              t.variant === "error" && "border-red-200",
              t.variant === "info" && "border-indigo-200",
            )}
          >
            <div className="mt-0.5">{ICONS[t.variant]}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-zinc-900">{t.title}</div>
              {t.description && (
                <div className="mt-0.5 text-xs text-zinc-600">{t.description}</div>
              )}
            </div>
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
