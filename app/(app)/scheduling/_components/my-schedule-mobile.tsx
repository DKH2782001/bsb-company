import { ShiftBlock } from "./shift-block";
import { getDayLabel, formatDateShort, isToday } from "../_lib/formatters";
import type {
  SchedulingEmployee,
  SchedulingShift,
  SchedulingTemplate,
  SchedulingUnavailability,
} from "../_lib/types";

type Props = {
  currentEmployee: SchedulingEmployee | null;
  weekDates: string[];
  shifts: SchedulingShift[];
  templates: SchedulingTemplate[];
  unavailabilities: SchedulingUnavailability[];
};

export function MyScheduleMobile({
  currentEmployee,
  weekDates,
  shifts,
  templates,
  unavailabilities,
}: Props) {
  const tplMap = new Map(templates.map((t) => [t.id, t]));

  const daysWithData = weekDates.map((date) => {
    const dayShifts = currentEmployee
      ? shifts.filter(
          (s) =>
            s.employeeId === currentEmployee.id &&
            s.date === date &&
            s.status !== "cancelled",
        )
      : [];
    const unavail = currentEmployee
      ? unavailabilities.some(
          (u) => u.employeeId === currentEmployee.id && u.date === date,
        )
      : false;
    return { date, shifts: dayShifts, unavail };
  });

  return (
    <div className="flex flex-col gap-3">
      {daysWithData.map(({ date, shifts: dayShifts, unavail }) => {
        const today = isToday(date);
        return (
          <div
            key={date}
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: today ? "var(--sch-warn)" : "var(--line-soft)",
              background: "var(--surface)",
            }}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center gap-2"
              style={{
                borderColor: "var(--line-soft)",
                background: today ? "var(--sch-warn-bg)" : "var(--surface-alt)",
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: today ? "var(--sch-warn)" : "var(--text-strong)" }}
              >
                {getDayLabel(date)} · {formatDateShort(date)}
              </span>
              {today && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--sch-warn)", color: "white" }}
                >
                  Hôm nay
                </span>
              )}
            </div>

            <div className="px-4 py-3">
              {unavail ? (
                <p className="text-sm italic" style={{ color: "var(--text-soft)" }}>
                  Báo bận
                </p>
              ) : dayShifts.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>
                  Không có ca
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayShifts.map((s) => {
                    const tpl = tplMap.get(s.templateId);
                    if (!tpl) return null;
                    return <ShiftBlock key={s.id} template={tpl} />;
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!currentEmployee && (
        <p className="text-center text-sm py-6" style={{ color: "var(--text-soft)" }}>
          Đăng nhập để xem lịch của bạn.
        </p>
      )}
    </div>
  );
}
