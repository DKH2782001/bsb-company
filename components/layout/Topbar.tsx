"use client";

import { Search, Calendar, ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NotificationBell } from "./NotificationBell";
import { t as rawT, type Locale } from "@/lib/i18n/dict";
import type { Notification } from "@/types/domain";

export function Topbar({
  userEmail,
  locale = "vi",
  roleLabel = "CEO",
  notifications = [],
  unreadCount = 0,
  authUserId = null,
  hasSupabase = false,
}: {
  userEmail?: string | null;
  locale?: Locale;
  roleLabel?: string;
  notifications?: Notification[];
  unreadCount?: number;
  authUserId?: string | null;
  hasSupabase?: boolean;
}) {
  const initials = (userEmail ?? "U").slice(0, 1).toUpperCase();
  const t = (k: Parameters<typeof rawT>[1]) => rawT(locale, k);

  return (
    <header className="sticky top-0 z-20 flex h-[78px] items-center gap-3 bg-white/88 px-6 backdrop-blur ring-1 ring-[var(--line-soft)] md:ml-[240px]">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[var(--text-soft)]" />
          <Input placeholder={t("topbar.search")} className="pl-11 h-12 text-[14px] bg-[var(--surface-alt)] border-transparent" />
        </div>
      </div>

      <button className="hidden sm:flex items-center gap-2 rounded-2xl bg-[var(--surface-alt)] px-3.5 py-2.5 text-[13px] text-[var(--text-strong)] hover:bg-[#ecefff]">
        <Calendar className="h-4 w-4 text-zinc-500" />
        <span>{t("topbar.period")}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      <Link
        href="/guide"
        className="hidden sm:flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] text-[var(--text-soft)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-strong)]"
      >
        <HelpCircle className="h-4 w-4" />
        {t("topbar.guide")}
      </Link>

      <LocaleSwitcher locale={locale} />

      <NotificationBell
        initialItems={notifications}
        initialUnread={unreadCount}
        authUserId={authUserId}
        hasSupabase={hasSupabase}
      />

      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5EF7] to-[#415BFF] text-[12px] font-semibold text-white shadow-[0_10px_25px_rgba(88,72,246,0.22)]">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-[12px] leading-tight">
          <span className="font-semibold text-[var(--text-strong)]">{userEmail ?? "Guest"}</span>
          <span className="text-[var(--text-soft)] mt-0.5">{roleLabel}</span>
        </div>
      </div>
    </header>
  );
}
