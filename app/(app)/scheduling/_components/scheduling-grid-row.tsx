import { ShiftCell } from "./shift-cell";
import { AssignShiftCell } from "./assign-shift-cell";
import { HoursSummaryCell } from "./hours-summary-cell";
import {
  computeWeeklyHours,
  computeWeeklyPay,
  getOverHoursShiftId,
} from "../_lib/compute";
import type {
  SchedulingEmployee,
  SchedulingShift,
  SchedulingTemplate,
  SchedulingUnavailability,
} from "../_lib/types";

type Props = {
  employee: SchedulingEmployee;
  weekDates: string[];
  shifts: SchedulingShift[];
  templates: SchedulingTemplate[];
  unavailabilities: SchedulingUnavailability[];
  weekStart: string;
  rowIndex: number;
};

export function SchedulingGridRow({
  employee,
  weekDates,
  shifts,
  templates,
  unavailabilities,
  weekStart,
  rowIndex,
}: Props) {
  const tplMap = new Map(templates.map((t) => [t.id, t]));
  const empShifts = shifts.filter((s) => s.employeeId === employee.id && s.status !== "cancelled");
  const unavailSet = new Set(
    unavailabilities.filter((u) => u.employeeId === employee.id).map((u) => u.date),
  );

  const weeklyHours = computeWeeklyHours(employee.id, shifts, templates);
  const weeklyPay = computeWeeklyPay(employee.id, shifts, templates, employee);
  const overHoursShiftId = getOverHoursShiftId(employee.id, shifts, templates, employee.maxHoursWeek);

  const delay = rowIndex * 30;

  return (
    <div
      className="sched-grid border-b sched-row-enter"
      style={{
        borderColor: "var(--line-soft)",
        minHeight: 64,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Employee cell */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 border-r"
        style={{ borderColor: "var(--line-soft)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex-shrink-0 grid place-items-center text-white text-[11px] font-semibold tracking-wide"
          style={{ background: employee.avatarGradient }}
          aria-hidden="true"
        >
          {employee.initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className="text-[13px] font-medium truncate"
            style={{ color: "var(--text-strong)" }}
          >
            {employee.name}
          </span>
          <span
            className="text-[11px] flex items-center gap-1"
            style={{ color: "var(--text-soft)" }}
          >
            {employee.role} | {employee.departmentName}
            {employee.isPartTime && (
              <span
                className="px-1 py-px rounded-sm text-[9px] uppercase tracking-[0.04em]"
                style={{
                  background: "var(--sch-warn-bg)",
                  color: "var(--sch-warn)",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                PT
              </span>
            )}
            {!employee.isPartTime && (
              <span
                className="px-1 py-px rounded-sm text-[9px] uppercase tracking-[0.04em]"
                style={{
                  background: "var(--surface-alt)",
                  color: "var(--text-soft)",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                FT
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Day cells */}
      {weekDates.map((date) => {
        const isUnavail = unavailSet.has(date);
        const dayShifts = empShifts.filter((s) => s.date === date);

        return (
          <div
            key={date}
            className="border-r p-1.5 relative"
            style={{
              borderColor: "var(--line-soft)",
              background: isUnavail
                ? "repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(0,0,0,0.025) 6px, rgba(0,0,0,0.025) 7px)"
                : undefined,
              cursor: isUnavail ? "default" : "pointer",
            }}
          >
            {isUnavail ? (
              <span
                className="absolute inset-0 grid place-items-center text-[10px] italic pointer-events-none select-none"
                style={{ color: "var(--text-soft)" }}
                aria-label="Báo bận"
              >
                Báo bận
              </span>
            ) : dayShifts.length > 0 ? (
              <div className="flex flex-col gap-1">
                {dayShifts.map((s) => {
                  const tpl = tplMap.get(s.templateId);
                  if (!tpl) return null;
                  return (
                    <ShiftCell
                      key={s.id}
                      shiftId={s.id}
                      template={tpl}
                      isOverHoursShift={s.id === overHoursShiftId}
                    />
                  );
                })}
                <AssignShiftCell
                  employeeId={employee.id}
                  date={date}
                  weekStart={weekStart}
                  templates={templates}
                />
              </div>
            ) : (
              <AssignShiftCell
                employeeId={employee.id}
                date={date}
                weekStart={weekStart}
                templates={templates}
              />
            )}
          </div>
        );
      })}

      {/* Hours summary cell */}
      <HoursSummaryCell
        hours={weeklyHours}
        maxHours={employee.maxHoursWeek}
        shiftCount={empShifts.length}
        weeklyPay={weeklyPay}
      />
    </div>
  );
}
