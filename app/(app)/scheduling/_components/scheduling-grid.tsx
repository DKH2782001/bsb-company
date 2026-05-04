import { SchedulingGridRow } from "./scheduling-grid-row";
import { SchedulingGridFooter } from "./scheduling-grid-footer";
import { getDayLabel, formatDateShort, isToday, isWeekend } from "../_lib/formatters";
import type {
  SchedulingEmployee,
  SchedulingShift,
  SchedulingTemplate,
  SchedulingUnavailability,
} from "../_lib/types";

type Props = {
  employees: SchedulingEmployee[];
  weekDates: string[];
  shifts: SchedulingShift[];
  templates: SchedulingTemplate[];
  unavailabilities: SchedulingUnavailability[];
  weekStart: string;
};

export function SchedulingGrid({
  employees,
  weekDates,
  shifts,
  templates,
  unavailabilities,
  weekStart,
}: Props) {
  return (
    <div
      className="rounded-[10px] border overflow-hidden min-w-[1100px]"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line-soft)",
      }}
    >
      {/* Header row */}
      <div
        className="sched-grid sticky top-0 z-10 border-b"
        style={{ background: "var(--surface-alt)", borderColor: "var(--line-soft)" }}
      >
        <div
          className="px-3 py-2.5 border-r text-[11px] font-medium uppercase tracking-[0.06em]"
          style={{ borderColor: "var(--line-soft)", color: "var(--text-soft)" }}
        >
          Nhân viên
        </div>

        {weekDates.map((date) => {
          const today = isToday(date);
          const weekend = isWeekend(date);
          return (
            <div
              key={date}
              className="flex flex-col items-center gap-0.5 px-3 py-2 border-r"
              style={{ borderColor: "var(--line-soft)" }}
            >
              <span
                className="text-[10px]"
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: "var(--text-soft)",
                }}
              >
                {getDayLabel(date)}{today ? " · hôm nay" : ""}
              </span>
              <span
                className="font-medium"
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: 16,
                  letterSpacing: "-0.02em",
                  color: today
                    ? "var(--sch-warn)"
                    : weekend
                      ? "var(--text-soft)"
                      : "var(--text-strong)",
                }}
              >
                {formatDateShort(date)}
              </span>
            </div>
          );
        })}

        <div
          className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.06em]"
          style={{ color: "var(--text-soft)" }}
        >
          Giờ tuần
        </div>
      </div>

      {/* Employee rows */}
      {employees.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm" style={{ color: "var(--text-soft)" }}>
          Chưa có nhân viên nào trong danh sách.
        </div>
      ) : (
        employees.map((emp, i) => (
          <SchedulingGridRow
            key={emp.id}
            employee={emp}
            weekDates={weekDates}
            shifts={shifts}
            templates={templates}
            unavailabilities={unavailabilities}
            weekStart={weekStart}
            rowIndex={i}
          />
        ))
      )}

      {/* Footer */}
      {templates.length > 0 && (
        <SchedulingGridFooter
          weekDates={weekDates}
          templates={templates}
          shifts={shifts}
        />
      )}
    </div>
  );
}
