import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { writeAuditLog } from "@/lib/repositories/audit";
import {
  getAuthenticatedUser,
  getDbClientOrThrow,
  getUserContext,
  withDemoFallback,
} from "@/lib/repositories/shared";
import {
  DEMO_COMPANY_ID,
  demoAttendanceLocations,
  demoAttendanceShifts,
  demoEmployees,
  demoMyAttendanceRecords,
  type DemoAttendanceLocation,
  type DemoAttendanceRecord,
  type DemoAttendanceShift,
} from "@/lib/queries/demo";
import { formatLocalISODate } from "@/lib/utils";

async function getEmployeeContext() {
  const user = await getAuthenticatedUser();
  const ctx = await getUserContext(user);
  return {
    companyId: ctx.companyId ?? DEMO_COMPANY_ID,
    employeeId: ctx.employeeId ?? demoEmployees[0]?.id ?? null,
  };
}

// In-memory store cho demo mode — giữ trong RAM của dev server.
// Mất khi restart server hoặc HMR rebuild file này.
const demoAttendanceStore: { records: DemoAttendanceRecord[] } = {
  records: [...demoMyAttendanceRecords],
};

function demoUpsertRecord(record: DemoAttendanceRecord) {
  const idx = demoAttendanceStore.records.findIndex(
    (r) => r.employee_id === record.employee_id && r.work_date === record.work_date,
  );
  if (idx >= 0) demoAttendanceStore.records[idx] = record;
  else demoAttendanceStore.records.unshift(record);
}

export type AttendanceLocation = DemoAttendanceLocation;
export type AttendanceShift = DemoAttendanceShift;
export type AttendanceRecord = DemoAttendanceRecord;

export type AttendanceMonthData = {
  records: AttendanceRecord[];
  locations: AttendanceLocation[];
  shifts: AttendanceShift[];
  todayRecord: AttendanceRecord | null;
  myShift: AttendanceShift | null;
  summary: {
    workedDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    totalMinutes: number;
  };
};

export type AttendanceSettings = {
  locations: AttendanceLocation[];
  shifts: AttendanceShift[];
};

export type CheckInInput = {
  latitude: number | null;
  longitude: number | null;
  ip: string | null;
  userAgent: string | null;
  note: string | null;
};

export type CheckInResult =
  | { ok: true; recordId: string; status: AttendanceRecord["status"]; lateMinutes: number; locationName: string | null }
  | { ok: false; error: string };

export type CheckOutResult =
  | { ok: true; recordId: string; status: AttendanceRecord["status"]; earlyLeaveMinutes: number; workedMinutes: number }
  | { ok: false; error: string };

const HOURS_TO_MIN = 60;

function todayISO(): string {
  return formatLocalISODate(new Date());
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * HOURS_TO_MIN + m;
}

function diffMinutes(from: string, to: string): number {
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pickLocation(
  locations: AttendanceLocation[],
  input: { latitude: number | null; longitude: number | null; ip: string | null },
): { location: AttendanceLocation | null; reason: string } {
  const active = locations.filter((l) => l.active);
  if (!active.length) return { location: null, reason: "Chưa có địa điểm chấm công nào hoạt động." };

  if (input.latitude != null && input.longitude != null) {
    for (const loc of active) {
      if (loc.latitude == null || loc.longitude == null) continue;
      const distance = haversineMeters(input.latitude, input.longitude, loc.latitude, loc.longitude);
      if (distance <= loc.radius_m) {
        return { location: loc, reason: `Trong vùng "${loc.name}" (cách ${Math.round(distance)}m).` };
      }
    }
  }

  if (input.ip) {
    for (const loc of active) {
      if (loc.ip_whitelist.some((ip) => ip === input.ip)) {
        return { location: loc, reason: `Khớp IP whitelist của "${loc.name}".` };
      }
    }
  }

  return { location: null, reason: "Bạn đang ngoài vùng cho phép chấm công." };
}

function shouldRelaxAttendanceGeofence(companyId: string | null) {
  return companyId === DEMO_COMPANY_ID || isDemoMode() || !hasSupabaseEnv();
}

export function resolveCheckInLocation(input: {
  companyId: string | null;
  locations: AttendanceLocation[];
  latitude: number | null;
  longitude: number | null;
  ip: string | null;
}) {
  const match = pickLocation(input.locations, {
    latitude: input.latitude,
    longitude: input.longitude,
    ip: input.ip,
  });

  if (match.location) {
    return { ...match, relaxed: false };
  }

  if (!shouldRelaxAttendanceGeofence(input.companyId)) {
    return { ...match, relaxed: false };
  }

  const fallbackLocation = input.locations.find((loc) => loc.active) ?? input.locations[0] ?? null;
  if (!fallbackLocation) {
    return { ...match, relaxed: false };
  }

  return {
    location: fallbackLocation,
    reason: match.reason,
    relaxed: true,
  };
}

function calcLateMinutes(shift: AttendanceShift | null, checkInAt: Date): number {
  if (!shift) return 0;
  const startMin = timeToMinutes(shift.start_time);
  const actualMin = checkInAt.getHours() * HOURS_TO_MIN + checkInAt.getMinutes();
  const diff = actualMin - startMin - shift.late_grace_minutes;
  return diff > 0 ? diff : 0;
}

function calcEarlyLeaveMinutes(shift: AttendanceShift | null, checkOutAt: Date): number {
  if (!shift) return 0;
  const endMin = timeToMinutes(shift.end_time);
  const actualMin = checkOutAt.getHours() * HOURS_TO_MIN + checkOutAt.getMinutes();
  const diff = endMin - actualMin - shift.early_leave_grace_minutes;
  return diff > 0 ? diff : 0;
}

function deriveStatus(record: Partial<AttendanceRecord>): AttendanceRecord["status"] {
  if (!record.check_in_at) return "incomplete";
  if (!record.check_out_at) return record.late_minutes && record.late_minutes > 0 ? "late" : "present";
  if ((record.early_leave_minutes ?? 0) > 0) return "early_leave";
  if ((record.late_minutes ?? 0) > 0) return "late";
  return "present";
}

function buildSummary(records: AttendanceRecord[]): AttendanceMonthData["summary"] {
  return records.reduce(
    (acc, r) => {
      if (r.check_in_at) acc.workedDays += 1;
      if (r.late_minutes > 0) acc.lateDays += 1;
      if (r.early_leave_minutes > 0) acc.earlyLeaveDays += 1;
      acc.totalMinutes += r.worked_minutes;
      return acc;
    },
    { workedDays: 0, lateDays: 0, earlyLeaveDays: 0, totalMinutes: 0 },
  );
}

export async function getAttendanceMonth(monthISO?: string): Promise<AttendanceMonthData> {
  const month = (monthISO ?? todayISO()).slice(0, 7);
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;

  const demoRecords = demoAttendanceStore.records;
  return withDemoFallback<AttendanceMonthData>(
    {
      records: demoRecords,
      locations: demoAttendanceLocations,
      shifts: demoAttendanceShifts,
      todayRecord: demoRecords.find((r) => r.work_date === todayISO()) ?? null,
      myShift: demoAttendanceShifts[0] ?? null,
      summary: buildSummary(demoRecords),
    },
    async (db) => {
      const user = await getAuthenticatedUser();
      const ctx = await getUserContext(user);
      if (!ctx.companyId || !ctx.employeeId) {
        return {
          records: [],
          locations: [],
          shifts: [],
          todayRecord: null,
          myShift: null,
          summary: { workedDays: 0, lateDays: 0, earlyLeaveDays: 0, totalMinutes: 0 },
        };
      }

      const [{ data: recs }, { data: locs }, { data: shs }, { data: assigns }] = await Promise.all([
        db
          .from("attendance_records")
          .select("*")
          .eq("company_id", ctx.companyId)
          .eq("employee_id", ctx.employeeId)
          .gte("work_date", monthStart)
          .lte("work_date", monthEnd)
          .order("work_date", { ascending: false }),
        db
          .from("attendance_locations")
          .select("*")
          .eq("company_id", ctx.companyId)
          .order("name"),
        db
          .from("attendance_shifts")
          .select("*")
          .eq("company_id", ctx.companyId)
          .order("start_time"),
        db
          .from("attendance_shift_assignments")
          .select("shift_id")
          .eq("company_id", ctx.companyId)
          .eq("employee_id", ctx.employeeId)
          .lte("effective_from", todayISO())
          .order("effective_from", { ascending: false })
          .limit(1),
      ]);

      const records = (recs ?? []) as AttendanceRecord[];
      const shifts = (shs ?? []) as AttendanceShift[];
      const assignRows = (assigns ?? []) as Array<{ shift_id: string | null }>;
      const myShiftId = assignRows[0]?.shift_id ?? null;
      const myShift = (shifts.find((s) => s.id === myShiftId) ?? shifts[0] ?? null) as AttendanceShift | null;

      return {
        records,
        locations: (locs ?? []) as AttendanceLocation[],
        shifts,
        todayRecord: records.find((r) => r.work_date === todayISO()) ?? null,
        myShift,
        summary: buildSummary(records),
      };
    },
  );
}

export async function checkIn(input: CheckInInput): Promise<CheckInResult> {
  const ctx = await getEmployeeContext();
  if (!ctx.companyId || !ctx.employeeId) {
    return { ok: false, error: "Không xác định được nhân viên hiện tại." };
  }

  const data = await getAttendanceMonth();
  if (data.todayRecord?.check_in_at) {
    return { ok: false, error: "Bạn đã chấm công vào ca hôm nay rồi." };
  }

  const resolvedLocation = resolveCheckInLocation({
    companyId: ctx.companyId,
    locations: data.locations,
    latitude: input.latitude,
    longitude: input.longitude,
    ip: input.ip,
  });
  const effectiveLocation = resolvedLocation.location;
  if (!effectiveLocation) {
    return { ok: false, error: resolvedLocation.reason };
  }

  const now = new Date();
  const lateMinutes = calcLateMinutes(data.myShift, now);
  const status = deriveStatus({ check_in_at: now.toISOString(), late_minutes: lateMinutes });

  let recordId = `demo-${Date.now()}`;

  try {
    const db = await getDbClientOrThrow();
    const recordsTable = db.from("attendance_records") as unknown as {
      upsert: (
        values: Record<string, unknown>,
        options: { onConflict: string },
      ) => { select: (cols: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
    };

    const { data: inserted, error } = await recordsTable
      .upsert(
        {
          company_id: ctx.companyId,
          employee_id: ctx.employeeId,
          work_date: todayISO(),
          shift_id: data.myShift?.id ?? null,
          location_id: effectiveLocation.id,
          check_in_at: now.toISOString(),
          check_in_lat: input.latitude,
          check_in_lng: input.longitude,
          check_in_ip: input.ip,
          source: "web",
          status,
          late_minutes: lateMinutes,
          note: input.note,
        },
        { onConflict: "employee_id,work_date" },
      )
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    recordId = inserted?.id ?? recordId;
  } catch {
    // demo mode — persist vào in-memory store
    if (shouldRelaxAttendanceGeofence(ctx.companyId) && ctx.employeeId) {
      demoUpsertRecord({
        id: recordId,
        company_id: ctx.companyId,
        employee_id: ctx.employeeId,
        work_date: todayISO(),
        shift_id: data.myShift?.id ?? null,
        location_id: effectiveLocation.id,
        check_in_at: now.toISOString(),
        check_out_at: null,
        late_minutes: lateMinutes,
        early_leave_minutes: 0,
        worked_minutes: 0,
        status,
        source: "web",
        note: input.note,
      });
    }
  }

  await writeAuditLog({
    action: "attendance.check_in",
    entity: "attendance_records",
    entityId: recordId,
    after: { location_id: effectiveLocation.id, late_minutes: lateMinutes, status },
  });

  return { ok: true, recordId, status, lateMinutes, locationName: effectiveLocation.name };
}

export async function checkOut(input: { latitude: number | null; longitude: number | null; ip: string | null; note: string | null }): Promise<CheckOutResult> {
  const ctx = await getEmployeeContext();
  if (!ctx.companyId || !ctx.employeeId) {
    return { ok: false, error: "Không xác định được nhân viên hiện tại." };
  }

  const data = await getAttendanceMonth();
  const inDemoMode = isDemoMode() || !hasSupabaseEnv();
  if (!data.todayRecord?.check_in_at && !inDemoMode) {
    return { ok: false, error: "Bạn chưa check-in nên không thể check-out." };
  }
  if (data.todayRecord?.check_out_at && !inDemoMode) {
    return { ok: false, error: "Bạn đã chấm công ra rồi." };
  }

  const now = new Date();
  const fakeCheckIn = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString();
  const checkInAtISO = data.todayRecord?.check_in_at ?? fakeCheckIn;
  const earlyLeaveMinutes = calcEarlyLeaveMinutes(data.myShift, now);
  const workedMinutes = diffMinutes(checkInAtISO, now.toISOString());
  const status = deriveStatus({
    check_in_at: checkInAtISO,
    check_out_at: now.toISOString(),
    late_minutes: data.todayRecord?.late_minutes ?? 0,
    early_leave_minutes: earlyLeaveMinutes,
  });

  let recordId = data.todayRecord?.id ?? `demo-${Date.now()}`;

  try {
    const db = await getDbClientOrThrow();
    const recordsTable = db.from("attendance_records") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
    };

    if (!data.todayRecord?.id) throw new Error("no-record");
    const { error } = await recordsTable
      .update({
        check_out_at: now.toISOString(),
        check_out_lat: input.latitude,
        check_out_lng: input.longitude,
        check_out_ip: input.ip,
        early_leave_minutes: earlyLeaveMinutes,
        worked_minutes: workedMinutes,
        status,
        note: input.note ?? data.todayRecord.note,
      })
      .eq("id", data.todayRecord.id);

    if (error) return { ok: false, error: error.message };
  } catch {
    // demo mode — persist vào in-memory store
    if (inDemoMode && ctx.employeeId) {
      const existing = data.todayRecord;
      demoUpsertRecord({
        id: recordId,
        company_id: ctx.companyId,
        employee_id: ctx.employeeId,
        work_date: todayISO(),
        shift_id: data.myShift?.id ?? null,
        location_id: existing?.location_id ?? data.locations[0]?.id ?? null,
        check_in_at: checkInAtISO,
        check_out_at: now.toISOString(),
        late_minutes: existing?.late_minutes ?? 0,
        early_leave_minutes: earlyLeaveMinutes,
        worked_minutes: workedMinutes,
        status,
        source: existing?.source ?? "web",
        note: input.note ?? existing?.note ?? null,
      });
    }
  }

  await writeAuditLog({
    action: "attendance.check_out",
    entity: "attendance_records",
    entityId: recordId,
    after: { worked_minutes: workedMinutes, early_leave_minutes: earlyLeaveMinutes, status },
  });

  return { ok: true, recordId, status, earlyLeaveMinutes, workedMinutes };
}

// =============================================================================
// Admin: settings (locations + shifts)
// =============================================================================

export async function getAttendanceSettings(): Promise<AttendanceSettings> {
  return withDemoFallback<AttendanceSettings>(
    { locations: demoAttendanceLocations, shifts: demoAttendanceShifts },
    async (db) => {
      const ctx = await getUserContext(await getAuthenticatedUser());
      if (!ctx.companyId) return { locations: [], shifts: [] };
      const [{ data: locs }, { data: shs }] = await Promise.all([
        db.from("attendance_locations").select("*").eq("company_id", ctx.companyId).order("name"),
        db.from("attendance_shifts").select("*").eq("company_id", ctx.companyId).order("start_time"),
      ]);
      return {
        locations: (locs ?? []) as AttendanceLocation[],
        shifts: (shs ?? []) as AttendanceShift[],
      };
    },
  );
}

export type LocationInput = {
  id?: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  radius_m: number;
  ip_whitelist: string[];
  active: boolean;
};

export async function upsertLocation(input: LocationInput) {
  const ctx = await getUserContext(await getAuthenticatedUser());
  if (!ctx.companyId) throw new Error("Thiếu company context.");
  const db = await getDbClientOrThrow();
  const table = db.from("attendance_locations") as unknown as {
    upsert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await table.upsert({
    id: input.id,
    company_id: ctx.companyId,
    name: input.name,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_m: input.radius_m,
    ip_whitelist: input.ip_whitelist,
    active: input.active,
  });
  if (error) throw new Error(error.message);
  await writeAuditLog({ action: "attendance.location.upsert", entity: "attendance_locations", entityId: input.id, after: input as unknown as Record<string, unknown> });
}

export async function deleteLocation(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("attendance_locations") as unknown as {
    delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
  };
  const { error } = await table.delete().eq("id", id);
  if (error) throw new Error(error.message);
  await writeAuditLog({ action: "attendance.location.delete", entity: "attendance_locations", entityId: id });
}

export type ShiftInput = {
  id?: string;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  late_grace_minutes: number;
  early_leave_grace_minutes: number;
  is_overnight: boolean;
  active: boolean;
};

export async function upsertShift(input: ShiftInput) {
  const ctx = await getUserContext(await getAuthenticatedUser());
  if (!ctx.companyId) throw new Error("Thiếu company context.");
  const db = await getDbClientOrThrow();
  const table = db.from("attendance_shifts") as unknown as {
    upsert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await table.upsert({
    id: input.id,
    company_id: ctx.companyId,
    code: input.code,
    name: input.name,
    start_time: input.start_time,
    end_time: input.end_time,
    break_minutes: input.break_minutes,
    late_grace_minutes: input.late_grace_minutes,
    early_leave_grace_minutes: input.early_leave_grace_minutes,
    is_overnight: input.is_overnight,
    active: input.active,
  });
  if (error) throw new Error(error.message);
  await writeAuditLog({ action: "attendance.shift.upsert", entity: "attendance_shifts", entityId: input.id, after: input as unknown as Record<string, unknown> });
}

export async function deleteShift(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("attendance_shifts") as unknown as {
    delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
  };
  const { error } = await table.delete().eq("id", id);
  if (error) throw new Error(error.message);
  await writeAuditLog({ action: "attendance.shift.delete", entity: "attendance_shifts", entityId: id });
}
