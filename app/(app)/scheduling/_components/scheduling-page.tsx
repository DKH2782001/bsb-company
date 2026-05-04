"use client";

import { useState } from "react";
import Link from "next/link";
import { SchedulingToolbar } from "./scheduling-toolbar";
import { SchedulingInsights } from "./scheduling-insights";
import { SchedulingGrid } from "./scheduling-grid";
import { MyScheduleMobile } from "./my-schedule-mobile";
import { formatWeekRange } from "../_lib/formatters";
import type { SchedulingPageData } from "../_lib/types";

type Props = {
  data: SchedulingPageData;
};

function buildWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const d = new Date(weekStart + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function SchedulingPageClient({ data }: Props) {
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const { employees, templates, shifts, unavailabilities, period, weekStart, weekEnd, pendingSwapCount } = data;
  const weekDates = buildWeekDates(weekStart);

  const availableRoles = [...new Set(employees.map((e) => e.role).filter(Boolean))];
  const filteredEmployees = roleFilter ? employees.filter((e) => e.role === roleFilter) : employees;

  const actionButtons = (
    <>
      <Link
        href="/scheduling/swaps"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors hover:bg-[var(--surface-alt)]"
        style={{ borderColor: "var(--line-soft)", color: "var(--text-strong)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        Đổi ca
        {pendingSwapCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: "var(--sch-warn)", color: "white" }}
          >
            {pendingSwapCount}
          </span>
        )}
      </Link>
      <Link
        href="/scheduling/settings"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors hover:bg-[var(--surface-alt)]"
        style={{ borderColor: "var(--line-soft)", color: "var(--text-strong)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        Cấu hình ca
      </Link>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium opacity-40 cursor-not-allowed"
        style={{ background: "var(--text-strong)", color: "var(--surface)" }}
        disabled
        title="Tính năng publish sẽ có ở phase sau"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 10.5 18.75 19.5 5.25" />
        </svg>
        {period?.status === "published" ? "Đã publish" : "Publish"}
      </button>
    </>
  );

  return (
    <div>
      {/* Toolbar: week nav + status + role filter + action buttons (cùng 1 hàng) */}
      <SchedulingToolbar
        weekStart={weekStart}
        weekEnd={weekEnd}
        period={period}
        roleFilter={roleFilter}
        onRoleFilter={setRoleFilter}
        availableRoles={availableRoles}
        actions={actionButtons}
      />

      {/* Desktop */}
      <div className="hidden md:block">
        <SchedulingInsights
          employees={filteredEmployees}
          shifts={shifts}
          templates={templates}
          weekDates={weekDates}
          pendingSwapCount={pendingSwapCount}
        />

        <div className="overflow-x-auto">
          {templates.length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center text-sm"
              style={{ borderColor: "var(--line-soft)", color: "var(--text-soft)" }}
            >
              Chưa có ca làm việc.{" "}
              <Link href="/scheduling/settings" className="underline">
                Tạo ca ngay
              </Link>
            </div>
          ) : (
            <SchedulingGrid
              employees={filteredEmployees}
              weekDates={weekDates}
              shifts={shifts}
              templates={templates}
              unavailabilities={unavailabilities}
              weekStart={weekStart}
            />
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden mt-4">
        <div className="mb-4">
          <h2 className="font-medium text-base mb-1" style={{ color: "var(--text-strong)" }}>
            Lịch của tôi — {formatWeekRange(weekStart, weekEnd)}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-soft)" }}>
            Xem lịch tuần của bạn. Quay ngang để xem toàn bộ team.
          </p>
        </div>
        <MyScheduleMobile
          currentEmployee={employees[0] ?? null}
          weekDates={weekDates}
          shifts={shifts}
          templates={templates}
          unavailabilities={unavailabilities}
        />
      </div>
    </div>
  );
}
