import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import {
  DEMO_COMPANY_ID,
  demoEmployees,
  demoHolidaysVN,
  demoLeaveBalances,
  demoLeaveRequests,
  demoLeaveTypes,
  type DemoHoliday,
  type DemoLeaveBalance,
  type DemoLeaveRequest,
  type DemoLeaveType,
} from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import {
  getAuthenticatedUser,
  getDbClientOrThrow,
  getUserContext,
  withDemoFallback,
} from "@/lib/repositories/shared";

export type LeaveType = DemoLeaveType;
export type LeaveBalance = DemoLeaveBalance;
export type LeaveRequest = DemoLeaveRequest;
export type Holiday = DemoHoliday;

export type LeaveRequestWithMeta = LeaveRequest & {
  employee_name: string | null;
  leave_type_name: string;
  leave_type_paid: boolean;
};

export type EmployeeLeaveData = {
  myEmployeeId: string | null;
  leaveTypes: LeaveType[];
  myBalances: LeaveBalance[];
  myRequests: LeaveRequestWithMeta[];
  upcomingHolidays: Holiday[];
};

export type ApprovalQueueData = {
  pending: LeaveRequestWithMeta[];
  recentlyDecided: LeaveRequestWithMeta[];
};

export type CalendarData = {
  startDate: string;
  endDate: string;
  requests: LeaveRequestWithMeta[];
  holidays: Holiday[];
};

const DAY_MS = 86_400_000;

async function getEmployeeContext() {
  const user = await getAuthenticatedUser();
  const ctx = await getUserContext(user);
  return {
    companyId: ctx.companyId ?? DEMO_COMPANY_ID,
    employeeId: ctx.employeeId ?? demoEmployees[0]?.id ?? null,
  };
}

function inDemoMode(): boolean {
  return isDemoMode() || !hasSupabaseEnv();
}

// In-memory store for demo mode
const demoStore: {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  types: LeaveType[];
  holidays: Holiday[];
} = {
  requests: [...demoLeaveRequests],
  balances: [...demoLeaveBalances],
  types: [...demoLeaveTypes],
  holidays: [...demoHolidaysVN],
};

function attachMeta(req: LeaveRequest): LeaveRequestWithMeta {
  const emp = demoEmployees.find((e) => e.id === req.employee_id);
  const type = demoStore.types.find((t) => t.id === req.leave_type_id);
  return {
    ...req,
    employee_name: emp?.full_name ?? null,
    leave_type_name: type?.name ?? "Không rõ",
    leave_type_paid: type?.paid ?? false,
  };
}

import { calculateTotalDays as countWorkingDays } from "@/lib/leave-utils";

// =============================================================================
// Read APIs
// =============================================================================

export async function getEmployeeLeaveData(): Promise<EmployeeLeaveData> {
  const ctx = await getEmployeeContext();
  const myEmployeeId = ctx.employeeId;
  const today = new Date().toISOString().slice(0, 10);

  return withDemoFallback<EmployeeLeaveData>(
    {
      myEmployeeId,
      leaveTypes: demoStore.types,
      myBalances: demoStore.balances.filter((b) => b.employee_id === myEmployeeId),
      myRequests: demoStore.requests
        .filter((r) => r.employee_id === myEmployeeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(attachMeta),
      upcomingHolidays: demoStore.holidays
        .filter((h) => h.holiday_date >= today)
        .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
        .slice(0, 5),
    },
    async (db) => {
      if (!ctx.companyId || !myEmployeeId) {
        return { myEmployeeId, leaveTypes: [], myBalances: [], myRequests: [], upcomingHolidays: [] };
      }
      const year = new Date().getFullYear();
      const [{ data: types }, { data: balances }, { data: reqs }, { data: hols }] = await Promise.all([
        db.from("leave_types").select("*").eq("company_id", ctx.companyId).eq("active", true).order("name"),
        db.from("leave_balances").select("*").eq("company_id", ctx.companyId).eq("employee_id", myEmployeeId).eq("year", year),
        db.from("leave_requests").select("*").eq("company_id", ctx.companyId).eq("employee_id", myEmployeeId).order("created_at", { ascending: false }).limit(20),
        db.from("holidays_vn").select("*").gte("holiday_date", today).order("holiday_date").limit(10),
      ]);
      const typesArr = (types ?? []) as LeaveType[];
      return {
        myEmployeeId,
        leaveTypes: typesArr,
        myBalances: (balances ?? []) as LeaveBalance[],
        myRequests: ((reqs ?? []) as LeaveRequest[]).map((r) => {
          const t = typesArr.find((x) => x.id === r.leave_type_id);
          return { ...r, employee_name: null, leave_type_name: t?.name ?? "", leave_type_paid: t?.paid ?? false };
        }),
        upcomingHolidays: (hols ?? []) as Holiday[],
      };
    },
  );
}

export async function getApprovalQueue(): Promise<ApprovalQueueData> {
  return withDemoFallback<ApprovalQueueData>(
    {
      pending: demoStore.requests.filter((r) => r.status === "pending").map(attachMeta),
      recentlyDecided: demoStore.requests
        .filter((r) => r.status === "approved" || r.status === "rejected")
        .sort((a, b) => (b.decided_at ?? "").localeCompare(a.decided_at ?? ""))
        .slice(0, 10)
        .map(attachMeta),
    },
    async (db) => {
      const ctx = await getEmployeeContext();
      if (!ctx.companyId) return { pending: [], recentlyDecided: [] };
      const [{ data: pending }, { data: decided }] = await Promise.all([
        db.from("leave_requests").select("*").eq("company_id", ctx.companyId).eq("status", "pending").order("created_at", { ascending: false }),
        db
          .from("leave_requests")
          .select("*")
          .eq("company_id", ctx.companyId)
          .in("status", ["approved", "rejected"])
          .order("decided_at", { ascending: false })
          .limit(10),
      ]);
      return {
        pending: ((pending ?? []) as LeaveRequest[]).map((r) => ({ ...r, employee_name: null, leave_type_name: "", leave_type_paid: true })),
        recentlyDecided: ((decided ?? []) as LeaveRequest[]).map((r) => ({ ...r, employee_name: null, leave_type_name: "", leave_type_paid: true })),
      };
    },
  );
}

export async function getCalendarData(monthISO?: string): Promise<CalendarData> {
  const month = (monthISO ?? new Date().toISOString().slice(0, 7));
  const start = `${month}-01`;
  const endDate = new Date(`${month}-01T00:00:00`);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  const end = endDate.toISOString().slice(0, 10);

  return withDemoFallback<CalendarData>(
    {
      startDate: start,
      endDate: end,
      requests: demoStore.requests
        .filter((r) => r.status !== "cancelled" && r.status !== "rejected" && r.starts_on <= end && r.ends_on >= start)
        .map(attachMeta),
      holidays: demoStore.holidays.filter((h) => h.holiday_date >= start && h.holiday_date <= end),
    },
    async (db) => {
      const ctx = await getEmployeeContext();
      if (!ctx.companyId) return { startDate: start, endDate: end, requests: [], holidays: [] };
      const [{ data: reqs }, { data: hols }] = await Promise.all([
        db
          .from("leave_requests")
          .select("*")
          .eq("company_id", ctx.companyId)
          .in("status", ["approved", "pending"])
          .lte("starts_on", end)
          .gte("ends_on", start),
        db.from("holidays_vn").select("*").gte("holiday_date", start).lte("holiday_date", end).order("holiday_date"),
      ]);
      return {
        startDate: start,
        endDate: end,
        requests: ((reqs ?? []) as LeaveRequest[]).map((r) => ({ ...r, employee_name: null, leave_type_name: "", leave_type_paid: true })),
        holidays: (hols ?? []) as Holiday[],
      };
    },
  );
}

// =============================================================================
// Mutations
// =============================================================================

export type SubmitLeaveInput = {
  leaveTypeId: string;
  startsOn: string;
  endsOn: string;
  halfDayStart: boolean;
  halfDayEnd: boolean;
  reason: string | null;
  handoverTo: string | null;
};

export type SubmitLeaveResult =
  | { ok: true; requestId: string; totalDays: number }
  | { ok: false; error: string };

export async function submitLeaveRequest(input: SubmitLeaveInput): Promise<SubmitLeaveResult> {
  const ctx = await getEmployeeContext();
  if (!ctx.companyId || !ctx.employeeId) {
    return { ok: false, error: "Không xác định được nhân viên hiện tại." };
  }

  if (!input.leaveTypeId) return { ok: false, error: "Chọn loại nghỉ phép." };
  if (!input.startsOn || !input.endsOn) return { ok: false, error: "Chọn ngày bắt đầu và kết thúc." };
  if (input.endsOn < input.startsOn) return { ok: false, error: "Ngày kết thúc không thể trước ngày bắt đầu." };

  const total = countWorkingDays(input.startsOn, input.endsOn, input.halfDayStart, input.halfDayEnd);
  if (total <= 0) return { ok: false, error: "Khoảng nghỉ không hợp lệ (toàn cuối tuần?)." };

  const requestId = `lr-${Date.now()}`;

  if (inDemoMode()) {
    demoStore.requests.unshift({
      id: requestId,
      company_id: ctx.companyId,
      employee_id: ctx.employeeId,
      leave_type_id: input.leaveTypeId,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      half_day_start: input.halfDayStart,
      half_day_end: input.halfDayEnd,
      total_days: total,
      reason: input.reason,
      handover_to: input.handoverTo,
      status: "pending",
      decided_by: null,
      decided_at: null,
      decision_note: null,
      created_at: new Date().toISOString(),
    });
    const balance = demoStore.balances.find(
      (b) => b.employee_id === ctx.employeeId && b.leave_type_id === input.leaveTypeId,
    );
    if (balance) balance.pending_days += total;
  } else {
    const db = await getDbClientOrThrow();
    const table = db.from("leave_requests") as unknown as {
      insert: (values: Record<string, unknown>) => { select: (cols: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
    };
    const { data: inserted, error } = await table
      .insert({
        company_id: ctx.companyId,
        employee_id: ctx.employeeId,
        leave_type_id: input.leaveTypeId,
        starts_on: input.startsOn,
        ends_on: input.endsOn,
        half_day_start: input.halfDayStart,
        half_day_end: input.halfDayEnd,
        total_days: total,
        reason: input.reason,
        handover_to: input.handoverTo,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    if (inserted?.id) {
      // Server-side balance update kept simple — relies on triggers in production
    }
  }

  await writeAuditLog({
    action: "leave.request.submit",
    entity: "leave_requests",
    entityId: requestId,
    after: { leave_type_id: input.leaveTypeId, starts_on: input.startsOn, ends_on: input.endsOn, total_days: total },
  });

  return { ok: true, requestId, totalDays: total };
}

export type DecideLeaveInput = {
  requestId: string;
  approve: boolean;
  note: string | null;
};

export async function decideLeaveRequest(input: DecideLeaveInput): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getEmployeeContext();
  if (!ctx.companyId || !ctx.employeeId) {
    return { ok: false, error: "Không xác định được người duyệt." };
  }

  if (inDemoMode()) {
    const req = demoStore.requests.find((r) => r.id === input.requestId);
    if (!req) return { ok: false, error: "Không tìm thấy đơn." };
    if (req.status !== "pending") return { ok: false, error: "Đơn đã được xử lý." };
    req.status = input.approve ? "approved" : "rejected";
    req.decided_by = ctx.employeeId;
    req.decided_at = new Date().toISOString();
    req.decision_note = input.note;

    const balance = demoStore.balances.find(
      (b) => b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id,
    );
    if (balance) {
      balance.pending_days = Math.max(0, balance.pending_days - req.total_days);
      if (input.approve) balance.used_days += req.total_days;
    }
  } else {
    const db = await getDbClientOrThrow();
    const table = db.from("leave_requests") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> } };
    };
    const { error } = await table
      .update({
        status: input.approve ? "approved" : "rejected",
        decided_by: ctx.employeeId,
        decided_at: new Date().toISOString(),
        decision_note: input.note,
      })
      .eq("id", input.requestId)
      .eq("status", "pending");
    if (error) return { ok: false, error: error.message };
  }

  await writeAuditLog({
    action: input.approve ? "leave.request.approve" : "leave.request.reject",
    entity: "leave_requests",
    entityId: input.requestId,
    after: { decided_by: ctx.employeeId, note: input.note },
  });

  return { ok: true };
}

export async function cancelLeaveRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getEmployeeContext();
  if (inDemoMode()) {
    const req = demoStore.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: "Không tìm thấy đơn." };
    if (req.employee_id !== ctx.employeeId) return { ok: false, error: "Chỉ chủ đơn mới được huỷ." };
    if (req.status !== "pending") return { ok: false, error: "Chỉ huỷ được đơn đang chờ duyệt." };
    req.status = "cancelled";
    const balance = demoStore.balances.find(
      (b) => b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id,
    );
    if (balance) balance.pending_days = Math.max(0, balance.pending_days - req.total_days);
  } else {
    const db = await getDbClientOrThrow();
    const table = db.from("leave_requests") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> } };
    };
    const { error } = await table
      .update({ status: "cancelled" })
      .eq("id", requestId)
      .eq("status", "pending");
    if (error) return { ok: false, error: error.message };
  }

  await writeAuditLog({ action: "leave.request.cancel", entity: "leave_requests", entityId: requestId });
  return { ok: true };
}

// =============================================================================
// Settings — leave types + holidays
// =============================================================================

export async function getLeaveSettings(): Promise<{ types: LeaveType[]; holidays: Holiday[] }> {
  return withDemoFallback(
    {
      types: demoStore.types,
      holidays: [...demoStore.holidays].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date)),
    },
    async (db) => {
      const ctx = await getEmployeeContext();
      if (!ctx.companyId) return { types: [], holidays: [] };
      const [{ data: types }, { data: hols }] = await Promise.all([
        db.from("leave_types").select("*").eq("company_id", ctx.companyId).order("name"),
        db.from("holidays_vn").select("*").or(`company_id.is.null,company_id.eq.${ctx.companyId}`).order("holiday_date"),
      ]);
      return { types: (types ?? []) as LeaveType[], holidays: (hols ?? []) as Holiday[] };
    },
  );
}

export type LeaveTypeInput = {
  id?: string;
  code: string;
  name: string;
  paid: boolean;
  default_quota_days: number | null;
  carry_over_max_days: number;
  requires_attachment: boolean;
  description: string | null;
  active: boolean;
};

export async function upsertLeaveType(input: LeaveTypeInput) {
  const ctx = await getEmployeeContext();
  if (!ctx.companyId) throw new Error("Thiếu company.");
  if (inDemoMode()) {
    if (input.id) {
      const existing = demoStore.types.find((t) => t.id === input.id);
      if (existing) Object.assign(existing, input);
    } else {
      demoStore.types.push({ id: `lt-${Date.now()}`, company_id: ctx.companyId, ...input });
    }
  } else {
    const db = await getDbClientOrThrow();
    const table = db.from("leave_types") as unknown as {
      upsert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await table.upsert({ ...input, company_id: ctx.companyId });
    if (error) throw new Error(error.message);
  }
  await writeAuditLog({ action: "leave.type.upsert", entity: "leave_types", entityId: input.id, after: input as unknown as Record<string, unknown> });
}

export async function deleteLeaveType(id: string) {
  if (inDemoMode()) {
    demoStore.types = demoStore.types.filter((t) => t.id !== id);
  } else {
    const db = await getDbClientOrThrow();
    const table = db.from("leave_types") as unknown as {
      delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
    const { error } = await table.delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  await writeAuditLog({ action: "leave.type.delete", entity: "leave_types", entityId: id });
}

export async function importVNHolidays(year: number) {
  const ctx = await getEmployeeContext();
  if (!ctx.companyId) throw new Error("Thiếu company.");

  const presets: Array<Omit<Holiday, "id" | "company_id">> = [
    { name: "Tết Dương lịch", holiday_date: `${year}-01-01`, is_paid: true, is_substitute: false, notes: null },
    { name: "Giỗ Tổ Hùng Vương", holiday_date: `${year}-04-26`, is_paid: true, is_substitute: false, notes: "10/3 ÂL — vui lòng kiểm tra ngày dương lịch chính xác" },
    { name: "Giải phóng miền Nam", holiday_date: `${year}-04-30`, is_paid: true, is_substitute: false, notes: null },
    { name: "Quốc tế Lao động", holiday_date: `${year}-05-01`, is_paid: true, is_substitute: false, notes: null },
    { name: "Quốc khánh", holiday_date: `${year}-09-02`, is_paid: true, is_substitute: false, notes: null },
    { name: "Quốc khánh (nghỉ liền kề)", holiday_date: `${year}-09-01`, is_paid: true, is_substitute: false, notes: "Theo Bộ luật LĐ 2019" },
  ];

  if (inDemoMode()) {
    let added = 0;
    for (const p of presets) {
      const exists = demoStore.holidays.some(
        (h) => h.holiday_date === p.holiday_date && h.name === p.name && (h.company_id == null || h.company_id === ctx.companyId),
      );
      if (!exists) {
        demoStore.holidays.push({ id: `h-${Date.now()}-${added}`, company_id: ctx.companyId, ...p });
        added += 1;
      }
    }
    await writeAuditLog({ action: "leave.holidays.import_vn", entity: "holidays_vn", after: { year, added } });
    return { added, total: presets.length };
  }

  const db = await getDbClientOrThrow();
  const table = db.from("holidays_vn") as unknown as {
    upsert: (values: Record<string, unknown>[], opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
  };
  const rows = presets.map((p) => ({ ...p, company_id: ctx.companyId }));
  const { error } = await table.upsert(rows, { onConflict: "company_id,holiday_date,name" });
  if (error) throw new Error(error.message);

  await writeAuditLog({ action: "leave.holidays.import_vn", entity: "holidays_vn", after: { year, count: rows.length } });
  return { added: rows.length, total: rows.length };
}

export async function deleteHoliday(id: string) {
  if (inDemoMode()) {
    demoStore.holidays = demoStore.holidays.filter((h) => h.id !== id);
  } else {
    const db = await getDbClientOrThrow();
    const table = db.from("holidays_vn") as unknown as {
      delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };
    const { error } = await table.delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  await writeAuditLog({ action: "leave.holiday.delete", entity: "holidays_vn", entityId: id });
}

export async function upsertHoliday(input: { id?: string; name: string; holiday_date: string; is_paid: boolean; is_substitute: boolean; notes: string | null }) {
  const ctx = await getEmployeeContext();
  if (!ctx.companyId) throw new Error("Thiếu company.");
  if (inDemoMode()) {
    if (input.id) {
      const existing = demoStore.holidays.find((h) => h.id === input.id);
      if (existing) Object.assign(existing, input);
    } else {
      demoStore.holidays.push({ id: `h-${Date.now()}`, company_id: ctx.companyId, ...input });
    }
  } else {
    const db = await getDbClientOrThrow();
    const table = db.from("holidays_vn") as unknown as {
      upsert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await table.upsert({ ...input, company_id: ctx.companyId });
    if (error) throw new Error(error.message);
  }
  await writeAuditLog({ action: "leave.holiday.upsert", entity: "holidays_vn", entityId: input.id, after: input as unknown as Record<string, unknown> });
}
