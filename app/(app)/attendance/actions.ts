"use server";

import { headers } from "next/headers";
import { refresh, revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  checkIn,
  checkOut,
  deleteLocation,
  deleteShift,
  upsertLocation,
  upsertShift,
  type CheckInResult,
  type CheckOutResult,
} from "@/lib/repositories/attendance";
import {
  regenerateAttendanceTimesheetMonth,
  setAttendanceTimesheetLock,
  updateAttendanceTimesheetRow,
} from "@/lib/repositories/attendance-timesheets";

async function readClientMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    const ip = xff?.split(",")[0]?.trim() || h.get("x-real-ip") || h.get("cf-connecting-ip") || null;
    const userAgent = h.get("user-agent");
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

function parseFloatOrNull(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function checkInAction(formData: FormData): Promise<CheckInResult> {
  const rl = await checkRateLimit({ key: "attendance:check-in", limit: 6, windowMs: 60_000 });
  if (!rl.allowed) {
    return { ok: false, error: `Bạn bấm chấm công quá nhanh. Thử lại sau ${rl.retryAfterSeconds}s.` };
  }

  const meta = await readClientMeta();
  const result = await checkIn({
    latitude: parseFloatOrNull(formData.get("latitude")),
    longitude: parseFloatOrNull(formData.get("longitude")),
    ip: meta.ip,
    userAgent: meta.userAgent,
    note: (formData.get("note")?.toString() ?? "").trim() || null,
  });

  if (result.ok) {
    revalidatePath("/attendance");
    refresh();
  }
  return result;
}

export async function checkOutAction(formData: FormData): Promise<CheckOutResult> {
  const rl = await checkRateLimit({ key: "attendance:check-out", limit: 6, windowMs: 60_000 });
  if (!rl.allowed) {
    return { ok: false, error: `Bạn bấm chấm công quá nhanh. Thử lại sau ${rl.retryAfterSeconds}s.` };
  }

  const meta = await readClientMeta();
  const result = await checkOut({
    latitude: parseFloatOrNull(formData.get("latitude")),
    longitude: parseFloatOrNull(formData.get("longitude")),
    ip: meta.ip,
    note: (formData.get("note")?.toString() ?? "").trim() || null,
  });

  if (result.ok) {
    revalidatePath("/attendance");
    refresh();
  }
  return result;
}

export async function upsertLocationAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const ipsRaw = String(formData.get("ip_whitelist") ?? "").trim();
    await upsertLocation({
      id: (formData.get("id") as string) || undefined,
      name: String(formData.get("name") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      latitude: parseFloatOrNull(formData.get("latitude")),
      longitude: parseFloatOrNull(formData.get("longitude")),
      radius_m: Number(formData.get("radius_m") ?? 200),
      ip_whitelist: ipsRaw ? ipsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
      active: formData.get("active") === "on",
    });
    revalidatePath("/attendance/settings");
    revalidatePath("/attendance");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lưu địa điểm thất bại." };
  }
}

export async function deleteLocationAction(formData: FormData): Promise<void> {
  try {
    await deleteLocation(String(formData.get("id") ?? ""));
    revalidatePath("/attendance/settings");
  } catch {
    // surface via UI later if needed
  }
}

export async function upsertShiftAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    await upsertShift({
      id: (formData.get("id") as string) || undefined,
      code: String(formData.get("code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      start_time: String(formData.get("start_time") ?? "08:30"),
      end_time: String(formData.get("end_time") ?? "17:30"),
      break_minutes: Number(formData.get("break_minutes") ?? 60),
      late_grace_minutes: Number(formData.get("late_grace_minutes") ?? 5),
      early_leave_grace_minutes: Number(formData.get("early_leave_grace_minutes") ?? 5),
      is_overnight: formData.get("is_overnight") === "on",
      active: formData.get("active") === "on",
    });
    revalidatePath("/attendance/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lưu ca làm thất bại." };
  }
}

export async function deleteShiftAction(formData: FormData): Promise<void> {
  try {
    await deleteShift(String(formData.get("id") ?? ""));
    revalidatePath("/attendance/settings");
  } catch {
    // surface via UI later if needed
  }
}

export async function regenerateAttendanceTimesheetAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const month = String(formData.get("month") ?? "");
    await regenerateAttendanceTimesheetMonth(month);
    revalidatePath("/attendance/timesheets");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể tổng hợp lại bảng công.",
    };
  }
}

export async function saveAttendanceTimesheetRowAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateAttendanceTimesheetRow(String(formData.get("rowId") ?? ""), {
      month: String(formData.get("month") ?? ""),
      manual_worked_days_adjustment: Number(formData.get("manualWorkedDaysAdjustment") ?? 0),
      manual_paid_leave_adjustment: Number(formData.get("manualPaidLeaveAdjustment") ?? 0),
      manual_unpaid_leave_adjustment: Number(formData.get("manualUnpaidLeaveAdjustment") ?? 0),
      manual_overtime_hours_adjustment: Number(formData.get("manualOvertimeHoursAdjustment") ?? 0),
      manual_note: String(formData.get("manualNote") ?? "").trim() || null,
    });
    revalidatePath("/attendance/timesheets");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể lưu điều chỉnh bảng công.",
    };
  }
}

export async function setAttendanceTimesheetLockAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const month = String(formData.get("month") ?? "");
    const locked = String(formData.get("locked") ?? "") === "true";
    await setAttendanceTimesheetLock(month, locked);
    revalidatePath("/attendance/timesheets");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không thể đổi trạng thái khóa bảng công.",
    };
  }
}
