import { hexToShiftToken } from "@/lib/color-mapping";
import { computeStaffing, computeTotalHours } from "../_lib/compute";
import type { SchedulingShift, SchedulingTemplate } from "../_lib/types";

type Props = {
  weekDates: string[];
  templates: SchedulingTemplate[];
  shifts: SchedulingShift[];
};

const TOKEN_DOT: Record<string, string> = {
  morning: "var(--shift-morning-border)",
  afternoon: "var(--shift-afternoon-border)",
  night: "var(--shift-night-bg)",
  custom: "var(--text-soft)",
};

export function SchedulingGridFooter({ weekDates, templates, shifts }: Props) {
  const activeShifts = shifts.filter((s) => s.status !== "cancelled");
  const totalHours = computeTotalHours(activeShifts, templates);
  const hasUnderstaffed = templates.some((tpl) =>
    weekDates.some((date) => {
      const count = computeStaffing(date, tpl.id, activeShifts);
      return count > 0 && count < tpl.minStaff;
    }),
  );

  return (
    <div
      className="sched-grid sticky bottom-0 border-t-2"
      style={{
        background: "var(--surface-alt)",
        borderColor: "var(--line-soft)",
      }}
    >
      {/* Label cell */}
      <div
        className="flex items-center px-3 py-2.5 border-r text-[11px] font-medium uppercase tracking-[0.06em]"
        style={{ borderColor: "var(--line-soft)", color: "var(--text-soft)" }}
      >
        Số ca / yêu cầu
      </div>

      {/* Per-day staffing cells */}
      {weekDates.map((date) => {
        const activeOnDay = templates.filter(
          (t) => computeStaffing(date, t.id, activeShifts) > 0,
        );

        return (
          <div
            key={date}
            className="flex flex-col gap-0.5 px-3 py-2.5 border-r"
            style={{ borderColor: "var(--line-soft)" }}
          >
            {activeOnDay.map((tpl) => {
              const count = computeStaffing(date, tpl.id, activeShifts);
              const token = hexToShiftToken(tpl.color);
              const isWarn = count < tpl.minStaff;

              return (
                <div
                  key={tpl.id}
                  className="flex items-center gap-1 text-[10px]"
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: TOKEN_DOT[token] ?? TOKEN_DOT.custom }}
                  />
                  <span
                    className={isWarn ? "font-semibold" : ""}
                    style={{
                      color: isWarn ? "var(--sch-warn)" : "var(--sch-ok)",
                    }}
                  >
                    {count}/{tpl.minStaff}
                  </span>
                  <span style={{ color: "var(--text-soft)" }}>
                    {tpl.shortLabel.toLowerCase()}{isWarn ? " ⚠" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Total hours cell */}
      <div
        className="flex flex-col justify-center gap-0.5 px-3 py-2.5"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="flex items-baseline gap-1"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>
            {totalHours}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-soft)" }}>
            h tổng
          </span>
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.06em]"
          style={{ color: hasUnderstaffed ? "var(--sch-warn)" : "var(--sch-ok)" }}
        >
          {hasUnderstaffed ? "Thiếu người" : "Đủ người"}
        </span>
      </div>
    </div>
  );
}
