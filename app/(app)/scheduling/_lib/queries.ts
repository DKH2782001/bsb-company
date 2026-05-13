import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { formatLocalISODate } from "@/lib/utils";
import {
  MOCK_EMPLOYEES,
  MOCK_SHIFT_TEMPLATES,
  getSchedulingShifts,
  MOCK_UNAVAILABILITIES,
  MOCK_PERIOD,
  MOCK_SWAP_REQUESTS,
} from "./mock-data";
import type { SchedulingPageData } from "./types";

function isDemo(): boolean {
  return isDemoMode() || !hasSupabaseEnv();
}

function getMondayOf(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function demoDepartmentForEmployee(employeeId: string) {
  if (["sch-e1", "sch-e2", "sch-e3"].includes(employeeId)) {
    return { departmentId: "dept-store", departmentName: "Cua hang trung tam" };
  }
  if (["sch-e4", "sch-e5"].includes(employeeId)) {
    return { departmentId: "dept-cskh", departmentName: "CSKH" };
  }
  return { departmentId: "dept-ops", departmentName: "Operations" };
}

function buildDemoSchedulingData(weekStart: string, weekEnd: string): SchedulingPageData {
  const pendingSwapCount = MOCK_SWAP_REQUESTS.filter((s) => s.status === "pending").length;
  const periodMatchesWeek = MOCK_PERIOD.weekStart === weekStart;

  return {
    period: periodMatchesWeek
      ? {
          id: MOCK_PERIOD.id,
          weekStart: MOCK_PERIOD.weekStart,
          weekEnd: MOCK_PERIOD.weekEnd,
          status: MOCK_PERIOD.status,
          publishedAt: MOCK_PERIOD.publishedAt,
        }
      : null,
    employees: MOCK_EMPLOYEES.map((e) => {
      const fallbackDepartment = demoDepartmentForEmployee(e.id);
      return {
        id: e.id,
        name: e.name,
        initials: e.initials,
        role: e.role,
        departmentId: e.departmentId ?? fallbackDepartment.departmentId,
        departmentName: e.departmentName ?? fallbackDepartment.departmentName,
        isPartTime: e.isPartTime,
        avatarGradient: e.avatarGradient,
        maxHoursWeek: e.maxHoursWeek,
        hourlyRate: e.hourlyRate,
      };
    }),
    templates: MOCK_SHIFT_TEMPLATES.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      shortLabel: t.shortLabel,
      color: t.color,
      startTime: t.startTime,
      endTime: t.endTime,
      breakMinutes: t.breakMinutes,
      isOvernight: t.isOvernight,
      minStaff: t.minStaff,
      maxStaff: t.maxStaff,
      nightMultiplier: t.nightMultiplier,
      weekendMultiplier: t.weekendMultiplier,
      hourlyRateMultiplier: t.hourlyRateMultiplier,
    })),
    shifts: getSchedulingShifts()
      .filter((s) => s.date >= weekStart && s.date <= weekEnd)
      .map((s) => ({
        id: s.id,
        employeeId: s.employeeId,
        templateId: s.templateId,
        date: s.date,
        status: s.status,
      })),
    unavailabilities: MOCK_UNAVAILABILITIES.filter((u) => u.date >= weekStart && u.date <= weekEnd).map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      date: u.date,
      reason: u.reason,
    })),
    weekStart,
    weekEnd,
    pendingSwapCount,
  };
}

export async function getSchedulingPageData(
  weekStartStr?: string,
): Promise<SchedulingPageData> {
  const today = formatLocalISODate(new Date());
  const monday = weekStartStr ? getMondayOf(weekStartStr) : getMondayOf(today);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const weekStart = formatLocalISODate(monday);
  const weekEnd = formatLocalISODate(sunday);

  if (isDemo()) return buildDemoSchedulingData(weekStart, weekEnd);

  if (isDemo()) {
    const pendingSwapCount = MOCK_SWAP_REQUESTS.filter(
      (s) => s.status === "pending",
    ).length;

    // Demo always uses the current-week mock period; other weeks show empty schedule
    const periodMatchesWeek = MOCK_PERIOD.weekStart === weekStart;

    return {
      period: periodMatchesWeek
        ? {
            id: MOCK_PERIOD.id,
            weekStart: MOCK_PERIOD.weekStart,
            weekEnd: MOCK_PERIOD.weekEnd,
            status: MOCK_PERIOD.status,
            publishedAt: MOCK_PERIOD.publishedAt,
          }
        : null,
      employees: MOCK_EMPLOYEES.map((e) => ({
        ...demoDepartmentForEmployee(e.id),
        id: e.id,
        name: e.name,
        initials: e.initials,
        role: e.role,
        departmentId: e.departmentId ?? demoDepartmentForEmployee(e.id).departmentId,
        departmentName: e.departmentName ?? demoDepartmentForEmployee(e.id).departmentName,
        isPartTime: e.isPartTime,
        avatarGradient: e.avatarGradient,
        maxHoursWeek: e.maxHoursWeek,
        hourlyRate: e.hourlyRate,
      })),
      templates: MOCK_SHIFT_TEMPLATES.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        shortLabel: t.shortLabel,
        color: t.color,
        startTime: t.startTime,
        endTime: t.endTime,
        breakMinutes: t.breakMinutes,
        isOvernight: t.isOvernight,
        minStaff: t.minStaff,
        maxStaff: t.maxStaff,
        nightMultiplier: t.nightMultiplier,
        weekendMultiplier: t.weekendMultiplier,
        hourlyRateMultiplier: t.hourlyRateMultiplier,
      })),
      shifts: getSchedulingShifts().filter(
        (s) => s.date >= weekStart && s.date <= weekEnd,
      ).map((s) => ({
        id: s.id,
        employeeId: s.employeeId,
        templateId: s.templateId,
        date: s.date,
        status: s.status,
      })),
      unavailabilities: MOCK_UNAVAILABILITIES.filter(
        (u) => u.date >= weekStart && u.date <= weekEnd,
      ).map((u) => ({
        id: u.id,
        employeeId: u.employeeId,
        date: u.date,
        reason: u.reason,
      })),
      weekStart,
      weekEnd,
      pendingSwapCount,
    };
  }

  // Live mode — query DB tables
  try {
    const { getAuthenticatedUser, getDbClientOrThrow, getUserContext } = await import(
      "@/lib/repositories/shared"
    );
    const { DEMO_COMPANY_ID } = await import("@/lib/queries/demo");

    const user = await getAuthenticatedUser();
    const ctx = await getUserContext(user);
    if (!ctx.companyId) {
      return buildDemoSchedulingData(weekStart, weekEnd);
    }
    const companyId = ctx.companyId ?? DEMO_COMPANY_ID;
    const db = await getDbClientOrThrow();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const any = (table: string) => db.from(table) as unknown as any;

    const [
      { data: empRows },
      { data: deptRows },
      { data: tplRows },
      { data: shiftRows },
      { data: unavailRows },
      { data: periodRows },
      { count: swapCount },
    ] = await Promise.all([
      any("employees").select("id,full_name,employment_type,base_salary,department_id").eq("company_id", companyId).eq("status", "active"),
      any("departments").select("id,name").eq("company_id", companyId),
      any("shift_templates").select("*").eq("company_id", companyId).eq("active", true),
      any("scheduled_shifts").select("id,employee_id,shift_template_id,shift_date,status").eq("company_id", companyId).gte("shift_date", weekStart).lte("shift_date", weekEnd),
      any("employee_unavailability").select("id,employee_id,date,reason").eq("company_id", companyId).gte("date", weekStart).lte("date", weekEnd),
      any("schedule_periods").select("id,week_start,week_end,status,published_at").eq("company_id", companyId).eq("week_start", weekStart).limit(1),
      any("shift_swap_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "pending"),
    ]);

    const gradients = [
      "linear-gradient(135deg, #5B7FB5, #2D4A78)",
      "linear-gradient(135deg, #B5705B, #7A3D2D)",
      "linear-gradient(135deg, #6B8E5B, #3E5A30)",
      "linear-gradient(135deg, #A06BB5, #5E3D78)",
      "linear-gradient(135deg, #B58F5B, #785B30)",
      "linear-gradient(135deg, #5BA8B5, #305C78)",
      "linear-gradient(135deg, #B5556B, #783040)",
      "linear-gradient(135deg, #7B9E87, #3D6B4F)",
    ];

    function initials(name: string): string {
      return name.split(" ").filter(Boolean).map((w) => w[0]).slice(-2).join("").toUpperCase();
    }

    const deptMap = new Map(((deptRows ?? []) as { id: string; name: string }[]).map((dept) => [dept.id, dept.name]));
    const employees = ((empRows ?? []) as { id: string; full_name: string; employment_type: string; base_salary: number; department_id: string | null }[]).map((e, i) => ({
      id: e.id,
      name: e.full_name,
      initials: initials(e.full_name),
      role: "",
      departmentId: e.department_id,
      departmentName: e.department_id ? (deptMap.get(e.department_id) ?? "Chua co phong ban") : "Chua co phong ban",
      isPartTime: e.employment_type === "parttime",
      avatarGradient: gradients[i % gradients.length],
      maxHoursWeek: e.employment_type === "parttime" ? 30 : 48,
      hourlyRate: Math.round(e.base_salary / 160),
    }));

    const templates = ((tplRows ?? []) as {
      id: string; code: string; name: string; start_time: string; end_time: string;
      break_minutes: number; is_overnight: boolean; min_staff: number; max_staff: number | null;
      night_multiplier: number; weekend_multiplier: number; hourly_rate_multiplier: number; color: string;
    }[]).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      shortLabel: t.name.replace("Ca ", ""),
      color: t.color,
      startTime: t.start_time,
      endTime: t.end_time,
      breakMinutes: t.break_minutes,
      isOvernight: t.is_overnight,
      minStaff: t.min_staff,
      maxStaff: t.max_staff ?? 99,
      nightMultiplier: t.night_multiplier,
      weekendMultiplier: t.weekend_multiplier,
      hourlyRateMultiplier: t.hourly_rate_multiplier,
    }));

    const shifts = ((shiftRows ?? []) as { id: string; employee_id: string; shift_template_id: string; shift_date: string; status: string }[]).map((s) => ({
      id: s.id,
      employeeId: s.employee_id,
      templateId: s.shift_template_id,
      date: s.shift_date,
      status: s.status as SchedulingPageData["shifts"][0]["status"],
    }));

    const unavailabilities = ((unavailRows ?? []) as { id: string; employee_id: string; date: string; reason: string | null }[]).map((u) => ({
      id: u.id,
      employeeId: u.employee_id,
      date: u.date,
      reason: u.reason,
    }));

    const periodRow = (periodRows as unknown as { id: string; week_start: string; week_end: string; status: string; published_at: string | null }[])?.[0] ?? null;

    if (employees.length === 0 || templates.length === 0) {
      return buildDemoSchedulingData(weekStart, weekEnd);
    }

    return {
      period: periodRow ? { id: periodRow.id, weekStart: periodRow.week_start, weekEnd: periodRow.week_end, status: periodRow.status as "draft" | "published" | "locked", publishedAt: periodRow.published_at } : null,
      employees,
      templates,
      shifts,
      unavailabilities,
      weekStart,
      weekEnd,
      pendingSwapCount: swapCount ?? 0,
    };
  } catch {
    return buildDemoSchedulingData(weekStart, weekEnd);
    // Graceful degradation — return empty schedule rather than crash
    return {
      period: null,
      employees: [],
      templates: [],
      shifts: [],
      unavailabilities: [],
      weekStart,
      weekEnd,
      pendingSwapCount: 0,
    };
  }
}
