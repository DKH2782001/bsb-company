"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { setLocaleAction } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/dict";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const setLocale = (next: Locale) => {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocaleAction(next, pathname);
    });
  };

  return (
    <div className="inline-flex rounded-xl bg-[var(--locale-bg)] p-1 text-[12px] font-semibold">
      {(["vi", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "px-2.5 py-1.5 rounded-lg transition-colors",
            l === locale ? "bg-[var(--locale-active-bg)] text-[var(--brand-700)] shadow-sm" : "text-[var(--text-soft)] hover:text-[var(--text-strong)]",
          )}
        >
          {l === "vi" ? "VI" : "EN"}
        </button>
      ))}
    </div>
  );
}
