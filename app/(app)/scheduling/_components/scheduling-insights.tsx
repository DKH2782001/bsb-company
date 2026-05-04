import {
  detectWarnings,
  computeTotalHours,
  computeTotalPay,
} from "../_lib/compute";
import { formatVNDCompact } from "../_lib/formatters";
import type {
  SchedulingEmployee,
  SchedulingShift,
  SchedulingTemplate,
} from "../_lib/types";

type Props = {
  employees: SchedulingEmployee[];
  shifts: SchedulingShift[];
  templates: SchedulingTemplate[];
  weekDates: string[];
  pendingSwapCount: number;
  swapRequesters?: string[];
};

export function SchedulingInsights({
  employees,
  shifts,
  templates,
  weekDates,
  pendingSwapCount,
  swapRequesters,
}: Props) {
  const activeShifts = shifts.filter((s) => s.status !== "cancelled");
  const totalHours = computeTotalHours(activeShifts, templates);
  const totalPay = computeTotalPay(employees, activeShifts, templates);
  const warnings = detectWarnings(employees, activeShifts, templates, weekDates);
  const shiftCount = activeShifts.length;

  const understaffedCount = warnings.filter((w) => w.type === "understaffed").length;
  const overHoursCount = warnings.filter((w) => w.type === "over_hours").length;

  const warnDetail = [
    understaffedCount > 0 && `${understaffedCount} ca thiếu người`,
    overHoursCount > 0 && `${overHoursCount} NV vượt giờ`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {/* Total hours */}
      <div
        className="rounded-[10px] border p-3.5 flex flex-col gap-1"
        style={{ background: "var(--surface)", borderColor: "var(--line-soft)" }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--text-soft)" }}
        >
          Tổng giờ tuần
        </span>
        <div
          className="flex items-baseline gap-0.5"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          <span className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
            {totalHours}
          </span>
          <span className="text-sm font-normal" style={{ color: "var(--text-soft)" }}>
            h
          </span>
        </div>
        <span className="text-[11px]" style={{ color: "var(--text-soft)" }}>
          {shiftCount} ca đã xếp · {employees.length} nhân viên
        </span>
      </div>

      {/* Estimated pay */}
      <div
        className="rounded-[10px] border p-3.5 flex flex-col gap-1"
        style={{ background: "var(--surface)", borderColor: "var(--line-soft)" }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--text-soft)" }}
        >
          Lương dự kiến
        </span>
        <div
          className="flex items-baseline gap-0.5"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {(() => {
            const compact = formatVNDCompact(totalPay);
            const numPart = compact.replace(/[^0-9.]/g, "");
            const unitPart = compact.replace(/[0-9.]/g, "");
            return (
              <>
                <span className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
                  {numPart}
                </span>
                <span className="text-sm font-normal" style={{ color: "var(--text-soft)" }}>
                  {unitPart}
                </span>
              </>
            );
          })()}
        </div>
        <span className="text-[11px]" style={{ color: "var(--text-soft)" }}>
          Đã tính hệ số đêm &amp; cuối tuần
        </span>
      </div>

      {/* Warnings */}
      <div
        className="rounded-[10px] border p-3.5 flex flex-col gap-1"
        style={{
          background: warnings.length > 0 ? "var(--sch-warn-bg)" : "var(--surface)",
          borderColor: warnings.length > 0 ? "#F5C9B4" : "var(--line-soft)",
        }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-[0.08em]"
          style={{ color: warnings.length > 0 ? "var(--sch-warn)" : "var(--text-soft)" }}
        >
          ⚠ Cần chú ý
        </span>
        <div
          className="flex items-baseline gap-1"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          <span
            className="text-[22px] font-medium"
            style={{
              letterSpacing: "-0.02em",
              color: warnings.length > 0 ? "var(--sch-warn)" : "var(--text-strong)",
            }}
          >
            {warnings.length}
          </span>
          <span
            className="text-sm font-normal"
            style={{ color: warnings.length > 0 ? "var(--sch-warn)" : "var(--text-soft)" }}
          >
            {" "}cảnh báo
          </span>
        </div>
        <span
          className="text-[11px]"
          style={{ color: warnings.length > 0 ? "var(--sch-warn)" : "var(--text-soft)" }}
        >
          {warnings.length === 0 ? "Không có vấn đề" : warnDetail}
        </span>
      </div>

      {/* Swap requests */}
      <div
        className="rounded-[10px] border p-3.5 flex flex-col gap-1"
        style={{ background: "var(--surface)", borderColor: "var(--line-soft)" }}
      >
        <span
          className="text-[10px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--text-soft)" }}
        >
          Đổi ca chờ duyệt
        </span>
        <span
          className="text-[22px] font-medium"
          style={{
            fontFamily: "var(--font-fraunces)",
            letterSpacing: "-0.02em",
            color: "var(--text-strong)",
          }}
        >
          {pendingSwapCount}
        </span>
        {swapRequesters && swapRequesters.length > 0 && (
          <span className="text-[11px]" style={{ color: "var(--text-soft)" }}>
            {swapRequesters.slice(0, 2).join(" · ")}
            {swapRequesters.length > 2 && ` +${swapRequesters.length - 2}`}
          </span>
        )}
      </div>
    </div>
  );
}
