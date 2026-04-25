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
    <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-[12px] font-semibold">
      {(["vi", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "px-2.5 py-1.5 rounded-lg transition-colors",
            l === locale ? "bg-white text-indigo-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700",
          )}
        >
          {l === "vi" ? "VI" : "EN"}
        </button>
      ))}
    </div>
  );
}
