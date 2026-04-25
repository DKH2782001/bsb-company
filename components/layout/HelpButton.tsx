"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { HELP } from "@/lib/help/content";
import { t as rawT, type Locale } from "@/lib/i18n/dict";
import { useAppContext } from "@/components/layout/AppContext";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["ceo", "cfo", "hr_admin", "dept_head", "auditor"]);

export function HelpButton({
  helpKey,
  locale: localeProp,
  roles: rolesProp,
}: {
  helpKey: string;
  locale?: Locale;
  roles?: string[];
}) {
  const ctx = useAppContext();
  const locale = localeProp ?? ctx.locale;
  const roles = rolesProp ?? ctx.roles;

  const [open, setOpen] = useState(false);
  const t = (key: Parameters<typeof rawT>[1]) => rawT(locale, key);
  const entry = HELP[helpKey];

  const isAdminRole = useMemo(() => roles.some((r) => ADMIN_ROLES.has(r)), [roles]);
  const [activeTab, setActiveTab] = useState<"admin" | "user">(isAdminRole ? "admin" : "user");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("help.button")}
        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[var(--surface-alt)] px-3.5 text-[13px] font-medium text-[var(--text-soft)] hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        title={t("help.button")}
      >
        <HelpCircle className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">{t("help.button")}</span>
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={entry ? entry.label[locale] : t("help.title")}
        closeLabel={t("help.close")}
      >
        {!entry ? (
          <div className="p-5 text-[13px] text-zinc-500">{t("help.noContent")}</div>
        ) : (
          <div className="flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-zinc-100">
              <div className="flex items-start gap-2.5">
                <span className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <entry.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] text-zinc-500 mb-0.5">{t("help.summary")}</div>
                  <p className="text-[13px] text-zinc-700 leading-relaxed">{entry.summary[locale]}</p>
                </div>
              </div>
            </div>

            <div className="px-5 pt-3 border-b border-zinc-100">
              <div className="flex gap-4">
                <TabButton
                  active={activeTab === "admin"}
                  onClick={() => setActiveTab("admin")}
                  label={t("help.tab.admin")}
                />
                <TabButton
                  active={activeTab === "user"}
                  onClick={() => setActiveTab("user")}
                  label={t("help.tab.user")}
                />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  {t("help.steps")}
                </div>
                <ol className="space-y-2 text-[13px] text-zinc-700">
                  {entry[activeTab][locale].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {entry.tips && entry.tips[locale].length > 0 && (
                <div className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    {t("help.tips")}
                  </div>
                  <ul className="space-y-1 text-[12.5px] text-zinc-700">
                    {entry.tips[locale].map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-indigo-400 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <Badge variant="info">{helpKey}</Badge>
                <Link
                  href="/guide"
                  onClick={() => setOpen(false)}
                  className="text-[12px] text-indigo-600 font-medium hover:underline"
                >
                  {t("help.openGuide")} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "whitespace-nowrap border-b-2 px-1 pb-3 text-[13px] font-medium transition-colors",
        active ? "border-indigo-600 text-indigo-700" : "border-transparent text-zinc-500 hover:text-zinc-700",
      )}
    >
      {label}
    </button>
  );
}
