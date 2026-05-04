import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import {
  DEMO_COMPANY_ID,
  demoEmployees,
  demoShiftTemplates,
  demoSchedulePeriods,
  demoScheduledShifts,
  demoShiftSwapRequests,
  type DemoShiftTemplate,
  type DemoSchedulePeriod,
  type DemoScheduledShift,
  type DemoShiftSwapRequest,
} from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import {
  getAuthenticatedUser,
  getDbClientOrThrow,
  getUserContext,
} from "@/lib/repositories/shared";
import { formatLocalISODate } from "@/lib/utils";

export type ShiftTemplate    = DemoShiftTemplate;
export type SchedulePeriod   = DemoSchedulePeriod;
export type ScheduledShift   = DemoScheduledShift;
export type ShiftSwapRequest = DemoShiftSwapRequest;

export type ScheduledShiftWithMeta = ScheduledShift & {
  employee_name: string;
  shift_name: string;
  shift_color: string;
  shift_start: string;
  shift_end: string;
};

export type SwapRequestWithMeta = ShiftSwapRequest & {
  requester_name: string;
  requester_shift_date: string;
  requester_shift_name: string;
  receiver_name: string | null;
};

export type WeekScheduleData = {
  period: SchedulePeriod | null;
  shifts: ScheduledShiftWithMeta[];
  templates: ShiftTemplate[];
  weekStart: string;
  weekEnd: string;
};

function inDemoMode(): boolean {
  return isDemoMode() || !hasSupabaseEnv();
}

async function getEmployeeContext() {
  const user = await getAuthenticatedUser();
  const ctx  = await getUserContext(user);
  return {
    companyId:  ctx.companyId  ?? DEMO_COMPANY_ID,
    employeeId: ctx.employeeId ?? demoEmployees[0]?.id ?? null,
  };
}

function getMondayOfWeek(dateStr: string): Date {
  const d   = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// In-memory demo store
const demoStore: {
  templates: ShiftTemplate[];
  periods:   SchedulePeriod[];
  shifts:    ScheduledShift[];
  swaps:     ShiftSwapRequest[];
} = {
  templates: [...demoShiftTemplates],
  periods:   [...demoSchedulePeriods],
  shifts:    [...demoScheduledShifts],
  swaps:     [...demoShiftSwapRequests],
};

// ─── TEMPLATES ────────────────────────────────────────────────

export async function getShiftTemplates(): Promise<ShiftTemplate[]> {
  if (inDemoMode()) return demoStore.templates.filter((t) => t.active);

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  const { data } = await db
    .from("shift_templates")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("start_time");
  return (data ?? []) as ShiftTemplate[];
}

export async function upsertShiftTemplate(
  input: Partial<ShiftTemplate> & { code: string; name: string; start_time: string; end_time: string },
): Promise<void> {
  if (inDemoMode()) {
    const idx = demoStore.templates.findIndex((t) => t.id === input.id);
    if (idx >= 0) {
      demoStore.templates[idx] = { ...demoStore.templates[idx], ...input } as ShiftTemplate;
    } else {
      demoStore.templates.unshift({
        id: `sht-${Date.now()}`,
        company_id: DEMO_COMPANY_ID,
        break_minutes: 0,
        is_overnight: false,
        role_required: null,
        min_staff: 1,
        max_staff: null,
        hourly_rate_multiplier: 1.0,
        night_multiplier: 1.3,
        weekend_multiplier: 2.0,
        holiday_multiplier: 3.0,
        color: "#6D5EF7",
        active: true,
        ...input,
      } as ShiftTemplate);
    }
    return;
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  const payload = { ...input, company_id: companyId, updated_at: new Date().toISOString() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tblShiftTemplates = db.from("shift_templates") as unknown as any;
  if (input.id) {
    await tblShiftTemplates.update(payload).eq("id", input.id).eq("company_id", companyId);
  } else {
    await tblShiftTemplates.insert(payload);
  }
  await writeAuditLog({ action: "scheduling.template.upsert", entity: "shift_templates", entityId: input.id ?? "new", meta: { name: input.name } });
}

export async function deleteShiftTemplate(id: string): Promise<void> {
  if (inDemoMode()) {
    const idx = demoStore.templates.findIndex((t) => t.id === id);
    if (idx >= 0) demoStore.templates[idx] = { ...demoStore.templates[idx], active: false };
    return;
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from("shift_templates") as unknown as any).update({ active: false }).eq("id", id).eq("company_id", companyId);
  await writeAuditLog({ action: "scheduling.template.delete", entity: "shift_templates", entityId: id, meta: {} });
}

// ─── WEEK SCHEDULE ────────────────────────────────────────────

export async function getWeekSchedule(weekStartStr?: string): Promise<WeekScheduleData> {
  const monday   = weekStartStr ? getMondayOfWeek(weekStartStr) : getMondayOfWeek(formatLocalISODate(new Date()));
  const sunday   = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const weekStart = formatLocalISODate(monday);
  const weekEnd   = formatLocalISODate(sunday);

  if (inDemoMode()) {
    const period = demoStore.periods.find((p) => p.week_start === weekStart) ?? null;
    const shifts = demoStore.shifts
      .filter((s) => s.shift_date >= weekStart && s.shift_date <= weekEnd)
      .map((s) => enrichShift(s, demoStore.templates));
    return { period, shifts, templates: demoStore.templates.filter((t) => t.active), weekStart, weekEnd };
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();

  const [{ data: periods }, { data: rawShifts }, { data: templates }] = await Promise.all([
    db.from("schedule_periods").select("*").eq("company_id", companyId).eq("week_start", weekStart).limit(1),
    db.from("scheduled_shifts").select("*, employees(full_name), shift_templates(name,color,start_time,end_time)").eq("company_id", companyId).gte("shift_date", weekStart).lte("shift_date", weekEnd),
    db.from("shift_templates").select("*").eq("company_id", companyId).eq("active", true),
  ]);

  const period = (periods ?? [])[0] ?? null;
  const tplMap = Object.fromEntries(((templates ?? []) as ShiftTemplate[]).map((t) => [t.id, t]));
  const shifts = ((rawShifts ?? []) as ScheduledShift[]).map((s) => enrichShift(s, Object.values(tplMap)));

  return { period: period as SchedulePeriod | null, shifts, templates: (templates ?? []) as ShiftTemplate[], weekStart, weekEnd };
}

function enrichShift(s: ScheduledShift, templates: ShiftTemplate[]): ScheduledShiftWithMeta {
  const tpl = templates.find((t) => t.id === s.shift_template_id);
  const emp = demoEmployees.find((e) => e.id === s.employee_id);
  return {
    ...s,
    employee_name: emp?.full_name ?? "—",
    shift_name:  tpl?.name  ?? "—",
    shift_color: tpl?.color ?? "#6D5EF7",
    shift_start: tpl?.start_time ?? "",
    shift_end:   tpl?.end_time   ?? "",
  };
}

// ─── PERIOD MANAGEMENT ────────────────────────────────────────

export async function getOrCreatePeriod(weekStart: string): Promise<SchedulePeriod> {
  if (inDemoMode()) {
    const existing = demoStore.periods.find((p) => p.week_start === weekStart);
    if (existing) return existing;
    const monday = getMondayOfWeek(weekStart);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const newPeriod: SchedulePeriod = {
      id: `sp-${Date.now()}`,
      company_id: DEMO_COMPANY_ID,
      week_start: weekStart,
      week_end: formatLocalISODate(sunday),
      status: "draft",
      published_at: null,
      notes: null,
    };
    demoStore.periods.push(newPeriod);
    return newPeriod;
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  const monday = getMondayOfWeek(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tblPeriods = db.from("schedule_periods") as unknown as any;
  const { data } = await tblPeriods
    .upsert({ company_id: companyId, week_start: weekStart, week_end: formatLocalISODate(sunday) }, { onConflict: "company_id,week_start" })
    .select()
    .single();
  return data as unknown as SchedulePeriod;
}

export async function publishPeriod(periodId: string): Promise<void> {
  if (inDemoMode()) {
    const idx = demoStore.periods.findIndex((p) => p.id === periodId);
    if (idx >= 0) {
      demoStore.periods[idx] = { ...demoStore.periods[idx], status: "published", published_at: new Date().toISOString() };
    }
    return;
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from("schedule_periods") as unknown as any).update({ status: "published", published_at: new Date().toISOString() }).eq("id", periodId).eq("company_id", companyId);
  await writeAuditLog({ action: "scheduling.period.publish", entity: "schedule_periods", entityId: periodId, meta: {} });
}

// ─── SHIFT ASSIGNMENT ─────────────────────────────────────────

export async function assignShift(input: {
  periodId: string;
  templateId: string;
  employeeId: string;
  shiftDate: string;
}): Promise<void> {
  if (inDemoMode()) {
    demoStore.shifts.push({
      id: `ss-${Date.now()}`,
      company_id: DEMO_COMPANY_ID,
      period_id: input.periodId,
      shift_template_id: input.templateId,
      employee_id: input.employeeId,
      shift_date: input.shiftDate,
      status: "scheduled",
      override_start: null,
      override_end: null,
      note: null,
    });
    return;
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from("scheduled_shifts") as unknown as any).insert({
    company_id: companyId,
    period_id: input.periodId,
    shift_template_id: input.templateId,
    employee_id: input.employeeId,
    shift_date: input.shiftDate,
  });
  await writeAuditLog({ action: "scheduling.shift.assign", entity: "scheduled_shifts", entityId: input.employeeId, meta: { date: input.shiftDate } });
}

export async function removeShift(shiftId: string): Promise<void> {
  if (inDemoMode()) {
    const idx = demoStore.shifts.findIndex((s) => s.id === shiftId);
    if (idx >= 0) demoStore.shifts[idx] = { ...demoStore.shifts[idx], status: "cancelled" };
    return;
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from("scheduled_shifts") as unknown as any).update({ status: "cancelled" }).eq("id", shiftId).eq("company_id", companyId);
  await writeAuditLog({ action: "scheduling.shift.remove", entity: "scheduled_shifts", entityId: shiftId, meta: {} });
}

// ─── SWAP REQUESTS ────────────────────────────────────────────

export async function getSwapRequests(filter: "pending" | "all" = "pending"): Promise<SwapRequestWithMeta[]> {
  if (inDemoMode()) {
    const swaps = filter === "pending"
      ? demoStore.swaps.filter((s) => s.status === "pending")
      : demoStore.swaps;
    return swaps.map((sw) => enrichSwap(sw));
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  const query = db.from("shift_swap_requests").select("*").eq("company_id", companyId);
  const { data } = filter === "pending" ? await query.eq("status", "pending") : await query.order("created_at", { ascending: false });
  return ((data ?? []) as ShiftSwapRequest[]).map((sw) => enrichSwap(sw));
}

function enrichSwap(sw: ShiftSwapRequest): SwapRequestWithMeta {
  const requesterShift = demoStore.shifts.find((s) => s.id === sw.requester_shift_id);
  const requesterEmp   = demoEmployees.find((e) => e.id === requesterShift?.employee_id);
  const receiverEmp    = sw.receiver_id ? demoEmployees.find((e) => e.id === sw.receiver_id) : null;
  const tpl = requesterShift ? demoStore.templates.find((t) => t.id === requesterShift.shift_template_id) : null;
  return {
    ...sw,
    requester_name: requesterEmp?.full_name ?? "—",
    requester_shift_date: requesterShift?.shift_date ?? "—",
    requester_shift_name: tpl?.name ?? "—",
    receiver_name: receiverEmp?.full_name ?? null,
  };
}

export async function decideSwapRequest(id: string, decision: "approved" | "rejected", note?: string): Promise<void> {
  if (inDemoMode()) {
    const idx = demoStore.swaps.findIndex((s) => s.id === id);
    if (idx >= 0) {
      demoStore.swaps[idx] = {
        ...demoStore.swaps[idx],
        status: decision,
        decided_by: demoEmployees[0]?.id ?? null,
        decided_at: new Date().toISOString(),
        decision_note: note ?? null,
      };
    }
    return;
  }

  const { companyId, employeeId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from("shift_swap_requests") as unknown as any)
    .update({ status: decision, decided_by: employeeId, decided_at: new Date().toISOString(), decision_note: note ?? null })
    .eq("id", id)
    .eq("company_id", companyId);
  await writeAuditLog({ action: `scheduling.swap.${decision}`, entity: "shift_swap_requests", entityId: id, meta: { note } });
}

export async function createSwapRequest(input: {
  requesterShiftId: string;
  requestType: "drop" | "swap";
  receiverShiftId?: string;
  receiverId?: string;
  reason?: string;
}): Promise<void> {
  if (inDemoMode()) {
    demoStore.swaps.unshift({
      id: `sw-${Date.now()}`,
      company_id: DEMO_COMPANY_ID,
      request_type: input.requestType,
      requester_shift_id: input.requesterShiftId,
      receiver_shift_id: input.receiverShiftId ?? null,
      receiver_id: input.receiverId ?? null,
      reason: input.reason ?? null,
      status: "pending",
      decided_by: null,
      decided_at: null,
      decision_note: null,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const { companyId } = await getEmployeeContext();
  const db = await getDbClientOrThrow();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from("shift_swap_requests") as unknown as any).insert({
    company_id: companyId,
    request_type: input.requestType,
    requester_shift_id: input.requesterShiftId,
    receiver_shift_id: input.receiverShiftId ?? null,
    receiver_id: input.receiverId ?? null,
    reason: input.reason ?? null,
  });
  await writeAuditLog({ action: "scheduling.swap.create", entity: "shift_swap_requests", entityId: input.requesterShiftId, meta: {} });
}
