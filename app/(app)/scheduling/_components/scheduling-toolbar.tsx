"use client";

import { useRouter } from "next/navigation";
import {
  formatWeekRange,
  formatWeekSubLabel,
  getISOWeekNumber,
  addWeeks,
  formatPublishedAgo,
} from "../_lib/formatters";
import type { SchedulingPeriod } from "../_lib/types";

type Props = {
  weekStart: string;
  weekEnd: string;
  period: SchedulingPeriod | null;
  roleFilter: string | null;
  onRoleFilter: (role: string | null) => void;
  availableRoles: string[];
  actions?: React.ReactNode;
};

function getLocalDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLocalMonday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SchedulingToolbar({
  weekStart,
  weekEnd,
  period,
  roleFilter,
  onRoleFilter,
  availableRoles,
  actions,
}: Props) {
  const router = useRouter();
  const weekNum = getISOWeekNumber(weekStart);
  const currentMonday = getLocalMonday(getLocalDateStr());

  const navigate = (newWeekStart: string) => {
    router.push(`/scheduling?week=${newWeekStart}`);
  };

  return (
    <div
      className="flex items-center gap-3 pb-4 mb-5 border-b flex-wrap"
      style={{ borderColor: "var(--line-soft)" }}
    >
      {/* Week navigation */}
      <div className="flex items-center gap-1.5">
        <button
          className="w-7 h-7 grid place-items-center rounded-lg border transition-colors hover:bg-[var(--surface-alt)]"
          style={{ borderColor: "var(--line-soft)", color: "var(--text-strong)" }}
          onClick={() => navigate(addWeeks(weekStart, -1))}
          aria-label="Tuần trước"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          className="w-7 h-7 grid place-items-center rounded-lg border transition-colors hover:bg-[var(--surface-alt)]"
          style={{ borderColor: "var(--line-soft)", color: "var(--text-strong)" }}
          onClick={() => navigate(addWeeks(weekStart, 1))}
          aria-label="Tuần sau"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <div className="flex flex-col pl-3 border-l" style={{ borderColor: "var(--line-soft)" }}>
          <span
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-strong)",
              lineHeight: 1.2,
            }}
          >
            {formatWeekRange(weekStart, weekEnd)}
          </span>
          <span
            className="text-[11px]"
            style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-soft)" }}
          >
            Tuần {weekNum} · {formatWeekSubLabel(weekStart, weekEnd)}
          </span>
        </div>

        {weekStart !== currentMonday && (
          <button
            className="ml-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors hover:bg-[var(--surface-alt)]"
            style={{ borderColor: "var(--line-soft)", color: "var(--text-soft)" }}
            onClick={() => navigate(currentMonday)}
          >
            Tuần này
          </button>
        )}
      </div>

      {/* Period status */}
      {period && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{
            background: period.status === "published" ? "var(--sch-ok-bg)" : "var(--surface-alt)",
            color: period.status === "published" ? "var(--sch-ok)" : "var(--text-soft)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: period.status === "published" ? "var(--sch-ok)" : "var(--text-soft)" }}
          />
          {period.status === "published"
            ? `Đã publish${period.publishedAt ? " · " + formatPublishedAgo(period.publishedAt) : ""}`
            : period.status === "locked"
              ? "Đã khóa"
              : "Bản nháp"}
        </div>
      )}

      <div className="flex-1" />

      {/* Role filter */}
      {availableRoles.length > 0 && (
        <div className="flex items-center gap-1.5">
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] border transition-colors"
            style={{
              borderColor: roleFilter ? "var(--text-soft)" : "var(--line-soft)",
              background: roleFilter ? "var(--text-strong)" : "transparent",
              color: roleFilter ? "var(--surface)" : "var(--text-soft)",
            }}
            onClick={() => onRoleFilter(null)}
          >
            {roleFilter ?? "Tất cả vị trí"}
            <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {roleFilter && availableRoles.map((r) => (
            <button
              key={r}
              className="px-2 py-1 rounded-lg text-[11px] border transition-colors hover:bg-[var(--surface-alt)]"
              style={{ borderColor: "var(--line-soft)", color: "var(--text-soft)" }}
              onClick={() => onRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Slot for action buttons from parent */}
      {actions && (
        <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: "var(--line-soft)" }}>
          {actions}
        </div>
      )}
    </div>
  );
}
