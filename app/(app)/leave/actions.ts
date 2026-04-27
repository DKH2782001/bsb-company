"use server";

import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  cancelLeaveRequest,
  decideLeaveRequest,
  deleteHoliday,
  deleteLeaveType,
  importVNHolidays,
  submitLeaveRequest,
  upsertHoliday,
  upsertLeaveType,
  type SubmitLeaveResult,
} from "@/lib/repositories/leave";

export async function submitLeaveAction(formData: FormData): Promise<SubmitLeaveResult> {
  const rl = await checkRateLimit({ key: "leave:submit", limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return { ok: false, error: `Bạn gửi đơn quá nhanh. Thử lại sau ${rl.retryAfterSeconds}s.` };

  const result = await submitLeaveRequest({
    leaveTypeId: String(formData.get("leaveTypeId") ?? ""),
    startsOn: String(formData.get("startsOn") ?? ""),
    endsOn: String(formData.get("endsOn") ?? ""),
    halfDayStart: formData.get("halfDayStart") === "on",
    halfDayEnd: formData.get("halfDayEnd") === "on",
    reason: String(formData.get("reason") ?? "").trim() || null,
    handoverTo: String(formData.get("handoverTo") ?? "").trim() || null,
  });

  if (result.ok) {
    revalidatePath("/leave");
    revalidatePath("/leave/calendar");
    revalidatePath("/leave/approvals");
  }
  return result;
}

export async function decideLeaveAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const result = await decideLeaveRequest({
    requestId: String(formData.get("requestId") ?? ""),
    approve: formData.get("decision") === "approve",
    note: String(formData.get("note") ?? "").trim() || null,
  });
  if (result.ok) {
    revalidatePath("/leave/approvals");
    revalidatePath("/leave");
    revalidatePath("/leave/calendar");
  }
  return result;
}

export async function cancelLeaveAction(formData: FormData): Promise<void> {
  await cancelLeaveRequest(String(formData.get("requestId") ?? ""));
  revalidatePath("/leave");
  revalidatePath("/leave/approvals");
  revalidatePath("/leave/calendar");
}

export async function upsertLeaveTypeAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    await upsertLeaveType({
      id: (formData.get("id") as string) || undefined,
      code: String(formData.get("code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      paid: formData.get("paid") === "on",
      default_quota_days: formData.get("default_quota_days") ? Number(formData.get("default_quota_days")) : null,
      carry_over_max_days: Number(formData.get("carry_over_max_days") ?? 0),
      requires_attachment: formData.get("requires_attachment") === "on",
      description: String(formData.get("description") ?? "").trim() || null,
      active: formData.get("active") === "on",
    });
    revalidatePath("/leave/settings");
    revalidatePath("/leave");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lưu thất bại." };
  }
}

export async function deleteLeaveTypeAction(formData: FormData): Promise<void> {
  try {
    await deleteLeaveType(String(formData.get("id") ?? ""));
    revalidatePath("/leave/settings");
  } catch {
    // ignore
  }
}

export async function importVNHolidaysAction(formData: FormData): Promise<{ ok: boolean; added?: number; error?: string }> {
  try {
    const year = Number(formData.get("year") ?? new Date().getFullYear());
    const result = await importVNHolidays(year);
    revalidatePath("/leave/settings");
    revalidatePath("/leave");
    revalidatePath("/leave/calendar");
    return { ok: true, added: result.added };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Import thất bại." };
  }
}

export async function upsertHolidayAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    await upsertHoliday({
      id: (formData.get("id") as string) || undefined,
      name: String(formData.get("name") ?? "").trim(),
      holiday_date: String(formData.get("holiday_date") ?? ""),
      is_paid: formData.get("is_paid") === "on",
      is_substitute: formData.get("is_substitute") === "on",
      notes: String(formData.get("notes") ?? "").trim() || null,
    });
    revalidatePath("/leave/settings");
    revalidatePath("/leave/calendar");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lưu thất bại." };
  }
}

export async function deleteHolidayAction(formData: FormData): Promise<void> {
  try {
    await deleteHoliday(String(formData.get("id") ?? ""));
    revalidatePath("/leave/settings");
    revalidatePath("/leave/calendar");
  } catch {
    // ignore
  }
}
