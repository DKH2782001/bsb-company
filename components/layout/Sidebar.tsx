"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NAV_GROUPS, type NavGroup, type NavItem } from "@/lib/nav";
import { t as rawT, type Locale } from "@/lib/i18n/dict";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bizos.sidebar.groups";

function filterGroups(groups: NavGroup[], roles: string[]): NavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r))),
    }))
    .filter((g) => g.items.length > 0);
}

function findGroupIdForPath(groups: NavGroup[], pathname: string): string | null {
  for (const g of groups) {
    if (g.items.some((i) => pathname === i.href || (i.href !== "/" && pathname.startsWith(i.href)))) {
      return g.id;
    }
  }
  return null;
}

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function getClientStored(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}
function getServerStored(): string {
  return "";
}

export function Sidebar({
  locale = "vi",
  roles = [],
}: {
  locale?: Locale;
  roles?: string[];
}) {
  const pathname = usePathname();
  const t = (key: Parameters<typeof rawT>[1]) => rawT(locale, key);

  const visibleGroups = useMemo(() => filterGroups(NAV_GROUPS, roles), [roles]);

  const storedRaw = useSyncExternalStore(subscribeStorage, getClientStored, getServerStored);

  const [localOverride, setLocalOverride] = useState<Set<string> | null>(null);

  const openGroups = useMemo(() => {
    if (localOverride) return localOverride;
    let set: Set<string>;
    if (storedRaw) {
      try {
        const arr = JSON.parse(storedRaw);
        set = Array.isArray(arr) ? new Set<string>(arr) : new Set();
      } catch {
        set = new Set();
      }
    } else {
      set = new Set(NAV_GROUPS.filter((g) => g.defaultOpen).map((g) => g.id));
    }
    const activeGroup = findGroupIdForPath(visibleGroups, pathname);
    if (activeGroup) set.add(activeGroup);
    return set;
  }, [storedRaw, localOverride, visibleGroups, pathname]);

  const toggle = (id: string) => {
    const next = new Set(openGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLocalOverride(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
    }
  };

  return (
    <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:bg-white md:ring-1 md:ring-[var(--line-soft)]">
      <div className="flex h-[78px] items-center gap-3 px-5 border-b border-[var(--line-soft)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5EF7] to-[#415BFF] text-white font-bold text-base shadow-[0_10px_25px_rgba(88,72,246,0.22)]">
          B
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[16px] font-bold text-[var(--text-strong)]">BIZOS</span>
          <span className="text-[11px] text-[var(--text-soft)] mt-0.5">{t("brand.tagline")}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {visibleGroups.map((group) => {
          const open = openGroups.has(group.id);
          const panelId = `sidebar-group-${group.id}`;
          return (
            <div key={group.id} className="pt-2 first:pt-0">
              <button
                type="button"
                onClick={() => toggle(group.id)}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={t("sidebar.group.toggle")}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-soft)] hover:text-[var(--text-strong)] transition-colors"
              >
                <span className="truncate">{t(group.labelKey)}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", open ? "" : "-rotate-90")}
                />
              </button>
              {open && (
                <div id={panelId} className="mt-1 space-y-1">
                  {group.items.map((item) => renderItem(item, pathname, t))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="m-3 rounded-[24px] bg-[linear-gradient(180deg,#1E2458,#12183F)] p-4 text-white shadow-[0_18px_34px_rgba(12,16,47,0.22)]">
        <div className="text-[11px] opacity-75 mb-1">{t("sidebar.perf")}</div>
        <div className="text-[28px] font-bold leading-tight">87%</div>
        <div className="text-[11px] opacity-80 mt-1.5 leading-tight">{t("sidebar.perfHint")}</div>
      </div>
    </aside>
  );
}

function renderItem(item: NavItem, pathname: string, t: (k: Parameters<typeof rawT>[1]) => string) {
  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
  const Icon = item.icon;
  return (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] transition-colors",
        active
          ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold shadow-[inset_0_0_0_1px_var(--brand-100)]"
          : "text-[var(--text-soft)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-strong)]",
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", active ? "bg-white" : "bg-[var(--surface-alt)]")}>
        <Icon className="h-[18px] w-[18px] shrink-0" />
      </span>
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}
