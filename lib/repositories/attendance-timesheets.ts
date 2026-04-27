import { randomUUID } from "node:crypto";
import { canManagePeople } from "@/lib/auth/permissions";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { calculateTotalDays } from "@/lib/leave-utils";
import {
  DEMO_COMPANY_ID,
  demoDepartments,
  demoEmployees,
  demoHolidaysVN,
  demoLeaveRequests,
  demoLeaveTypes,
  demoMyAttendanceRecords,
} from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import {
  getAuthenticatedUser,
  getDbClientOrThrow,
  getUserContext,
  withDemoFallback,
} from "@/lib/repositories/shared";

export type AttendanceTimesheetPeriod = {
  id: string;
  company_id: string;
  month: string;
  status: "draft" | "locked";
  generated_at: string;
  locked_at: string | null;
  locked_by: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceTimesheetRow = {
  id: string;
  period_id: string;
  company_id: string;
  employee_id: string;
  worked_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  holiday_days: number;
  overtime_hours: number;
  late_days: number;
  late_minutes: number;
  early_leave_days: number;
  early_leave_minutes: number;
  worked_minutes: number;
  manual_worked_days_adjustment: number;
  manual_paid_leave_adjustment: number;
  manual_unpaid_leave_adjustment: number;
  manual_overtime_hours_adjustment: number;
  manual_note: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceTimesheetRowWithMeta = AttendanceTimesheetRow & {
  employee_name: string;
  department_name: string | null;
  total_worked_days: number;
  total_paid_leave_days: number;
  total_unpaid_leave_days: number;
  total_overtime_hours: number;
};

export type AttendanceTimesheetMonthData = {
  month: string;
  period: AttendanceTimesheetPeriod;
  rows: AttendanceTimesheetRowWithMeta[];
  summary: {
    employees: number;
    workedDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    overtimeHours: number;
    lateDays: number;
  };
  canManage: boolean;
};

type AttendanceRecordLike = {
  employee_id: string;
  work_date: string;
  check_in_at: string | null;
  worked_minutes: number;
  late_minutes: number;
  early_leave_minutes: number;
};

type LeaveRequestLike = {
  employee_id: string;
  leave_type_id: string;
  starts_on: string;
  ends_on: string;
  half_day_start: boolean;
  half_day_end: boolean;
  status: string;
};

type LeaveTypeLike = {
  id: string;
  paid: boolean;
};

type HolidayLike = {
  holiday_date: string;
};

type OvertimeRequestLike = {
  employee_id: string;
  starts_at: string;
  hours: number;
  status: string;
};

type EmployeeLike = {
  id: string;
  full_name: string;
  department_id: string | null;
  status?: string | null;
};

type DepartmentLike = {
  id: string;
  name: string;
};

type EditableAdjustments = Pick<
  AttendanceTimesheetRow,
  | "manual_worked_days_adjustment"
  | "manual_paid_leave_adjustment"
  | "manual_unpaid_leave_adjustment"
  | "manual_overtime_hours_adjustment"
  | "manual_note"
>;

type StoredRowMap = Record<string, AttendanceTimesheetRow>;

const demoTimesheetStore: {
  periods: AttendanceTimesheetPeriod[];
  rows: AttendanceTimesheetRow[];
} = {
  periods: [],
  rows: [],
};

function inDemoMode() {
  return isDemoMode() || !hasSupabaseEnv();
}

async function getTimesheetContext() {
  const user = await getAuthenticatedUser();
  const ctx = await getUserContext(user);
  return {
    companyId: ctx.companyId ?? DEMO_COMPANY_ID,
    employeeId: ctx.employeeId ?? null,
    canManage: canManagePeople(ctx),
  };
}

function normalizeMonth(month?: string) {
  const raw = (month ?? new Date().toISOString().slice(0, 7)).trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 7);
}

function monthRange(month: string) {
  const start = `${month}-01`;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  const nextMonth = endDate.toISOString().slice(0, 10);
  endDate.setDate(0);
  return {
    start,
    end: endDate.toISOString().slice(0, 10),
    nextMonth,
  };
}

function clipRange(startsOn: string, endsOn: string, monthStart: string, monthEnd: string) {
  const start = startsOn > monthStart ? startsOn : monthStart;
  const end = endsOn < monthEnd ? endsOn : monthEnd;
  if (end < start) return null;
  return { start, end };
}

function countHolidayDays(holidays: HolidayLike[]) {
  return holidays.reduce((sum, holiday) => {
    const date = new Date(`${holiday.holiday_date}T00:00:00`);
    const day = date.getDay();
    return sum + (day === 0 || day === 6 ? 0 : 1);
  }, 0);
}

function calculateLeaveDaysForMonth(
  request: LeaveRequestLike,
  monthStart: string,
  monthEnd: string,
) {
  const clipped = clipRange(request.starts_on, request.ends_on, monthStart, monthEnd);
  if (!clipped) return 0;

  return calculateTotalDays(
    clipped.start,
    clipped.end,
    clipped.start === request.starts_on ? request.half_day_start : false,
    clipped.end === request.ends_on ? request.half_day_end : false,
  );
}

function formatRowWithMeta(
  row: AttendanceTimesheetRow,
  employees: EmployeeLike[],
  departments: DepartmentLike[],
): AttendanceTimesheetRowWithMeta {
  const employee = employees.find((item) => item.id === row.employee_id);
  const department = departments.find((item) => item.id === employee?.department_id);

  return {
    ...row,
    employee_name: employee?.full_name ?? row.employee_id,
    department_name: department?.name ?? null,
    total_worked_days: Number((row.worked_days + row.manual_worked_days_adjustment).toFixed(2)),
    total_paid_leave_days: Number((row.paid_leave_days + row.manual_paid_leave_adjustment).toFixed(2)),
    total_unpaid_leave_days: Number((row.unpaid_leave_days + row.manual_unpaid_leave_adjustment).toFixed(2)),
    total_overtime_hours: Number((row.overtime_hours + row.manual_overtime_hours_adjustment).toFixed(2)),
  };
}

function buildSummary(rows: AttendanceTimesheetRowWithMeta[]) {
  return rows.reduce(
    (acc, row) => {
      acc.employees += 1;
      acc.workedDays += row.total_worked_days;
      acc.paidLeaveDays += row.total_paid_leave_days;
      acc.unpaidLeaveDays += row.total_unpaid_leave_days;
      acc.overtimeHours += row.total_overtime_hours;
      acc.lateDays += row.late_days;
      return acc;
    },
    { employees: 0, workedDays: 0, paidLeaveDays: 0, unpaidLeaveDays: 0, overtimeHours: 0, lateDays: 0 },
  );
}

function computeBaseRows(input: {
  periodId: string;
  companyId: string;
  month: string;
  employees: EmployeeLike[];
  records: AttendanceRecordLike[];
  leaveRequests: LeaveRequestLike[];
  leaveTypes: LeaveTypeLike[];
  holidays: HolidayLike[];
  overtimeRequests: OvertimeRequestLike[];
  existingRows: StoredRowMap;
}): AttendanceTimesheetRow[] {
  const { periodId, companyId, employees, records, leaveRequests, leaveTypes, holidays, overtimeRequests, existingRows } = input;
  const { start, end } = monthRange(input.month);
  const holidayDays = countHolidayDays(holidays);
  const now = new Date().toISOString();

  return employees
    .filter((employee) => employee.status !== "terminated")
    .map((employee) => {
      const employeeRecords = records.filter((record) => record.employee_id === employee.id);
      const approvedLeaves = leaveRequests.filter(
        (request) => request.employee_id === employee.id && request.status === "approved",
      );
      const employeeOt = overtimeRequests.filter(
        (request) =>
          request.employee_id === employee.id &&
          request.status === "approved" &&
          request.starts_at.slice(0, 10) >= start &&
          request.starts_at.slice(0, 10) <= end,
      );
      const previous = existingRows[employee.id];

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      for (const request of approvedLeaves) {
        const days = calculateLeaveDaysForMonth(request, start, end);
        if (!days) continue;
        const type = leaveTypes.find((item) => item.id === request.leave_type_id);
        if (type?.paid) paidLeaveDays += days;
        else unpaidLeaveDays += days;
      }

      return {
        id: previous?.id ?? randomUUID(),
        period_id: periodId,
        company_id: companyId,
        employee_id: employee.id,
        worked_days: employeeRecords.filter((record) => Boolean(record.check_in_at)).length,
        paid_leave_days: Number(paidLeaveDays.toFixed(2)),
        unpaid_leave_days: Number(unpaidLeaveDays.toFixed(2)),
        holiday_days: holidayDays,
        overtime_hours: Number(employeeOt.reduce((sum, request) => sum + (request.hours ?? 0), 0).toFixed(2)),
        late_days: employeeRecords.filter((record) => record.late_minutes > 0).length,
        late_minutes: employeeRecords.reduce((sum, record) => sum + (record.late_minutes ?? 0), 0),
        early_leave_days: employeeRecords.filter((record) => record.early_leave_minutes > 0).length,
        early_leave_minutes: employeeRecords.reduce((sum, record) => sum + (record.early_leave_minutes ?? 0), 0),
        worked_minutes: employeeRecords.reduce((sum, record) => sum + (record.worked_minutes ?? 0), 0),
        manual_worked_days_adjustment: previous?.manual_worked_days_adjustment ?? 0,
        manual_paid_leave_adjustment: previous?.manual_paid_leave_adjustment ?? 0,
        manual_unpaid_leave_adjustment: previous?.manual_unpaid_leave_adjustment ?? 0,
        manual_overtime_hours_adjustment: previous?.manual_overtime_hours_adjustment ?? 0,
        manual_note: previous?.manual_note ?? null,
        created_at: previous?.created_at ?? now,
        updated_at: now,
      };
    });
}

function createDraftPeriod(companyId: string, month: string, existing?: AttendanceTimesheetPeriod | null) {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? randomUUID(),
    company_id: companyId,
    month,
    status: existing?.status ?? "draft",
    generated_at: now,
    locked_at: existing?.locked_at ?? null,
    locked_by: existing?.locked_by ?? null,
    note: existing?.note ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  } satisfies AttendanceTimesheetPeriod;
}

async function buildMonthData(
  month: string,
  options?: { requireManage?: boolean; forceRefresh?: boolean },
): Promise<AttendanceTimesheetMonthData> {
  const monthKey = normalizeMonth(month);
  const ctx = await getTimesheetContext();
  if (options?.requireManage && !ctx.canManage) {
    throw new Error("Chỉ CEO/HR Admin mới được chốt bảng công.");
  }

  return withDemoFallback<AttendanceTimesheetMonthData>(
    (() => {
      const period =
        demoTimesheetStore.periods.find((item) => item.month === monthKey) ??
        createDraftPeriod(ctx.companyId, monthKey);
      const existingRows = Object.fromEntries(
        demoTimesheetStore.rows
          .filter((item) => item.period_id === period.id)
          .map((item) => [item.employee_id, item]),
      ) as StoredRowMap;
      const rowsSource =
        period.status === "locked" && !options?.forceRefresh
          ? demoTimesheetStore.rows.filter((item) => item.period_id === period.id)
          : computeBaseRows({
              periodId: period.id,
              companyId: ctx.companyId,
              month: monthKey,
              employees: demoEmployees,
              records: demoMyAttendanceRecords,
              leaveRequests: demoLeaveRequests,
              leaveTypes: demoLeaveTypes,
              holidays: demoHolidaysVN.filter((item) => item.holiday_date.startsWith(monthKey)),
              overtimeRequests: [],
              existingRows,
            });

      const nextPeriod = { ...period, generated_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      demoTimesheetStore.periods = [
        ...demoTimesheetStore.periods.filter((item) => item.id !== nextPeriod.id),
        nextPeriod,
      ];
      demoTimesheetStore.rows = [
        ...demoTimesheetStore.rows.filter((item) => item.period_id !== nextPeriod.id),
        ...rowsSource,
      ];

      const rows = rowsSource
        .map((row) => formatRowWithMeta(row, demoEmployees, demoDepartments))
        .sort((a, b) => a.employee_name.localeCompare(b.employee_name));

      return {
        month: monthKey,
        period: nextPeriod,
        rows,
        summary: buildSummary(rows),
        canManage: true,
      };
    })(),
    async (db) => {
      if (!ctx.companyId) throw new Error("Thiếu company context.");

      const { start, end, nextMonth } = monthRange(monthKey);
      const [
        { data: employeesData },
        { data: departmentsData },
        { data: recordsData },
        { data: leaveReqsData },
        { data: leaveTypesData },
        { data: holidaysData },
        { data: overtimeData },
        { data: periodData },
      ] = await Promise.all([
        db.from("employees").select("id, full_name, department_id, status").eq("company_id", ctx.companyId).order("full_name"),
        db.from("departments").select("id, name").eq("company_id", ctx.companyId).order("name"),
        db
          .from("attendance_records")
          .select("employee_id, work_date, check_in_at, worked_minutes, late_minutes, early_leave_minutes")
          .eq("company_id", ctx.companyId)
          .gte("work_date", start)
          .lte("work_date", end),
        db
          .from("leave_requests")
          .select("employee_id, leave_type_id, starts_on, ends_on, half_day_start, half_day_end, status")
          .eq("company_id", ctx.companyId)
          .eq("status", "approved")
          .lte("starts_on", end)
          .gte("ends_on", start),
        db.from("leave_types").select("id, paid").eq("company_id", ctx.companyId),
        db
          .from("holidays_vn")
          .select("holiday_date")
          .or(`company_id.is.null,company_id.eq.${ctx.companyId}`)
          .gte("holiday_date", start)
          .lte("holiday_date", end),
        db
          .from("overtime_requests")
          .select("employee_id, starts_at, hours, status")
          .eq("company_id", ctx.companyId)
          .eq("status", "approved")
          .gte("starts_at", `${start}T00:00:00`)
          .lt("starts_at", `${nextMonth}T00:00:00`),
        db
          .from("attendance_monthly_periods")
          .select("*")
          .eq("company_id", ctx.companyId)
          .eq("month", monthKey)
          .maybeSingle(),
      ]);

      const period = createDraftPeriod(ctx.companyId, monthKey, (periodData as AttendanceTimesheetPeriod | null) ?? null);
      const periodsTable = db.from("attendance_monthly_periods") as unknown as {
        upsert: (values: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
        update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
      };
      const rowsTable = db.from("attendance_monthly_rows") as unknown as {
        select: (cols: string) => { eq: (col: string, val: string) => Promise<{ data: AttendanceTimesheetRow[] | null; error: { message: string } | null }> };
        upsert: (values: Record<string, unknown>[], opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
      };

      if (!periodData || period.status === "draft" || options?.forceRefresh) {
        const { error: periodError } = await periodsTable.upsert(
          {
            id: period.id,
            company_id: period.company_id,
            month: period.month,
            status: period.status,
            generated_at: period.generated_at,
            locked_at: period.locked_at,
            locked_by: period.locked_by,
            note: period.note,
            created_at: period.created_at,
            updated_at: period.updated_at,
          },
          { onConflict: "company_id,month" },
        );
        if (periodError) throw new Error(periodError.message);
      }

      const existingRowsResult = await rowsTable.select("*").eq("period_id", period.id);
      if (existingRowsResult.error) throw new Error(existingRowsResult.error.message);

      const existingRows = Object.fromEntries(
        (existingRowsResult.data ?? []).map((item) => [item.employee_id, item]),
      ) as StoredRowMap;

      let rowsSource: AttendanceTimesheetRow[];
      if (period.status === "locked" && !options?.forceRefresh) {
        rowsSource = existingRowsResult.data ?? [];
      } else {
        rowsSource = computeBaseRows({
          periodId: period.id,
          companyId: ctx.companyId,
          month: monthKey,
          employees: (employeesData ?? []) as EmployeeLike[],
          records: (recordsData ?? []) as AttendanceRecordLike[],
          leaveRequests: (leaveReqsData ?? []) as LeaveRequestLike[],
          leaveTypes: (leaveTypesData ?? []) as LeaveTypeLike[],
          holidays: (holidaysData ?? []) as HolidayLike[],
          overtimeRequests: (overtimeData ?? []) as OvertimeRequestLike[],
          existingRows,
        });
        const { error: rowsError } = await rowsTable.upsert(
          rowsSource.map((row) => ({ ...row })),
          { onConflict: "period_id,employee_id" },
        );
        if (rowsError) throw new Error(rowsError.message);
      }

      const rows = rowsSource
        .map((row) =>
          formatRowWithMeta(
            row,
            (employeesData ?? []) as EmployeeLike[],
            (departmentsData ?? []) as DepartmentLike[],
          ),
        )
        .sort((a, b) => a.employee_name.localeCompare(b.employee_name));

      return {
        month: monthKey,
        period,
        rows,
        summary: buildSummary(rows),
        canManage: ctx.canManage,
      };
    },
  );
}

export async function getAttendanceTimesheetMonth(month?: string) {
  return buildMonthData(month ?? normalizeMonth(), { requireManage: false });
}

export async function regenerateAttendanceTimesheetMonth(month: string) {
  const data = await buildMonthData(month, { requireManage: true, forceRefresh: true });
  await writeAuditLog({
    action: "attendance.timesheet.regenerate",
    entity: "attendance_monthly_periods",
    entityId: data.period.id,
    after: { month: data.month, status: data.period.status },
  });
  return data;
}

export async function updateAttendanceTimesheetRow(
  rowId: string,
  input: EditableAdjustments & { month: string },
) {
  const ctx = await getTimesheetContext();
  if (!ctx.canManage) throw new Error("Chỉ CEO/HR Admin mới được chỉnh bảng công.");

  if (inDemoMode()) {
    const row = demoTimesheetStore.rows.find((item) => item.id === rowId);
    if (!row) throw new Error("Không tìm thấy dòng bảng công.");
    const period = demoTimesheetStore.periods.find((item) => item.id === row.period_id);
    if (period?.status === "locked") throw new Error("Bảng công đã khóa. Hãy mở khóa trước khi chỉnh.");
    Object.assign(row, input, { updated_at: new Date().toISOString() });
  } else {
    const db = await getDbClientOrThrow();
    const rowsTable = db.from("attendance_monthly_rows") as unknown as {
      select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: AttendanceTimesheetRow | null; error: { message: string } | null }> } };
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
    const periodsTable = db.from("attendance_monthly_periods") as unknown as {
      select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: AttendanceTimesheetPeriod | null; error: { message: string } | null }> } };
    };

    const { data: row, error: rowError } = await rowsTable.select("*").eq("id", rowId).maybeSingle();
    if (rowError) throw new Error(rowError.message);
    if (!row) throw new Error("Không tìm thấy dòng bảng công.");

    const { data: period, error: periodError } = await periodsTable.select("*").eq("id", row.period_id).maybeSingle();
    if (periodError) throw new Error(periodError.message);
    if (period?.status === "locked") throw new Error("Bảng công đã khóa. Hãy mở khóa trước khi chỉnh.");

    const { error: updateError } = await rowsTable
      .update({
        manual_worked_days_adjustment: input.manual_worked_days_adjustment,
        manual_paid_leave_adjustment: input.manual_paid_leave_adjustment,
        manual_unpaid_leave_adjustment: input.manual_unpaid_leave_adjustment,
        manual_overtime_hours_adjustment: input.manual_overtime_hours_adjustment,
        manual_note: input.manual_note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rowId);
    if (updateError) throw new Error(updateError.message);
  }

  await writeAuditLog({
    action: "attendance.timesheet.row.update",
    entity: "attendance_monthly_rows",
    entityId: rowId,
    after: input as unknown as Record<string, unknown>,
  });
}

export async function setAttendanceTimesheetLock(month: string, locked: boolean) {
  const ctx = await getTimesheetContext();
  if (!ctx.canManage) throw new Error("Chỉ CEO/HR Admin mới được khóa bảng công.");

  const data = await buildMonthData(month, { requireManage: true, forceRefresh: false });
  const now = new Date().toISOString();
  const nextStatus = locked ? "locked" : "draft";

  if (inDemoMode()) {
    const period = demoTimesheetStore.periods.find((item) => item.id === data.period.id);
    if (!period) throw new Error("Không tìm thấy kỳ bảng công.");
    period.status = nextStatus;
    period.locked_at = locked ? now : null;
    period.locked_by = locked ? ctx.employeeId : null;
    period.updated_at = now;
  } else {
    const db = await getDbClientOrThrow();
    const periodsTable = db.from("attendance_monthly_periods") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
    const { error } = await periodsTable
      .update({
        status: nextStatus,
        locked_at: locked ? now : null,
        locked_by: locked ? ctx.employeeId : null,
        updated_at: now,
      })
      .eq("id", data.period.id);
    if (error) throw new Error(error.message);
  }

  await writeAuditLog({
    action: locked ? "attendance.timesheet.lock" : "attendance.timesheet.unlock",
    entity: "attendance_monthly_periods",
    entityId: data.period.id,
    after: { month, status: nextStatus },
  });
}
