import type {
  SchedulingEmployee,
  SchedulingShift,
  SchedulingTemplate,
  ShiftWarning,
} from "./types";

export function computeShiftHours(template: SchedulingTemplate): number {
  const [sh, sm] = template.startTime.split(":").map(Number);
  const [eh, em] = template.endTime.split(":").map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (template.isOvernight) endMins += 24 * 60;
  return Math.max(0, (endMins - startMins - template.breakMinutes) / 60);
}

export function computeWeeklyHours(
  employeeId: string,
  shifts: SchedulingShift[],
  templates: SchedulingTemplate[],
): number {
  const tplMap = new Map(templates.map((t) => [t.id, t]));
  return shifts
    .filter((s) => s.employeeId === employeeId && s.status !== "cancelled")
    .reduce((acc, s) => {
      const tpl = tplMap.get(s.templateId);
      return acc + (tpl ? computeShiftHours(tpl) : 0);
    }, 0);
}

export function computeWeeklyPay(
  employeeId: string,
  shifts: SchedulingShift[],
  templates: SchedulingTemplate[],
  employee: SchedulingEmployee,
): number {
  const tplMap = new Map(templates.map((t) => [t.id, t]));
  return shifts
    .filter((s) => s.employeeId === employeeId && s.status !== "cancelled")
    .reduce((acc, s) => {
      const tpl = tplMap.get(s.templateId);
      if (!tpl) return acc;
      const hours = computeShiftHours(tpl);
      const dow = new Date(s.date + "T00:00:00").getDay();
      const isWeekend = dow === 0 || dow === 6;
      const multiplier = isWeekend
        ? tpl.weekendMultiplier
        : tpl.isOvernight
          ? tpl.nightMultiplier
          : tpl.hourlyRateMultiplier;
      return acc + employee.hourlyRate * hours * multiplier;
    }, 0);
}

export function computeStaffing(
  date: string,
  templateId: string,
  shifts: SchedulingShift[],
): number {
  return shifts.filter(
    (s) => s.date === date && s.templateId === templateId && s.status !== "cancelled",
  ).length;
}

export function detectWarnings(
  employees: SchedulingEmployee[],
  shifts: SchedulingShift[],
  templates: SchedulingTemplate[],
  weekDates: string[],
): ShiftWarning[] {
  const warnings: ShiftWarning[] = [];
  const active = shifts.filter((s) => s.status !== "cancelled");

  for (const emp of employees) {
    const hours = computeWeeklyHours(emp.id, active, templates);
    if (hours > emp.maxHoursWeek) {
      warnings.push({
        type: "over_hours",
        employeeId: emp.id,
        message: `${emp.name}: ${hours}h / ${emp.maxHoursWeek}h`,
      });
    }
  }

  for (const date of weekDates) {
    for (const tpl of templates) {
      const count = computeStaffing(date, tpl.id, active);
      if (count > 0 && count < tpl.minStaff) {
        warnings.push({
          type: "understaffed",
          templateId: tpl.id,
          date,
          message: `${date} ${tpl.name}: ${count}/${tpl.minStaff}`,
        });
      }
    }
  }

  return warnings;
}

/** Returns the shift ID that first pushes the employee over their hour limit. */
export function getOverHoursShiftId(
  employeeId: string,
  shifts: SchedulingShift[],
  templates: SchedulingTemplate[],
  maxHoursWeek: number,
): string | null {
  const tplMap = new Map(templates.map((t) => [t.id, t]));
  const empShifts = shifts
    .filter((s) => s.employeeId === employeeId && s.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));

  let acc = 0;
  for (const s of empShifts) {
    const tpl = tplMap.get(s.templateId);
    if (!tpl) continue;
    acc += computeShiftHours(tpl);
    if (acc > maxHoursWeek) return s.id;
  }
  return null;
}

export function computeTotalHours(
  shifts: SchedulingShift[],
  templates: SchedulingTemplate[],
): number {
  const tplMap = new Map(templates.map((t) => [t.id, t]));
  return shifts
    .filter((s) => s.status !== "cancelled")
    .reduce((acc, s) => {
      const tpl = tplMap.get(s.templateId);
      return acc + (tpl ? computeShiftHours(tpl) : 0);
    }, 0);
}

export function computeTotalPay(
  employees: SchedulingEmployee[],
  shifts: SchedulingShift[],
  templates: SchedulingTemplate[],
): number {
  return employees.reduce(
    (acc, emp) => acc + computeWeeklyPay(emp.id, shifts, templates, emp),
    0,
  );
}
