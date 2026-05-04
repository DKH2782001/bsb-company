"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import {
  assignShift,
  createSwapRequest,
  decideSwapRequest,
  deleteShiftTemplate,
  getOrCreatePeriod,
  publishPeriod,
  removeShift,
  upsertShiftTemplate,
  type ShiftTemplate,
} from "@/lib/repositories/scheduling";
import { demoAddShift, demoCancelShift } from "./_lib/mock-data";

function isDemo(): boolean {
  return isDemoMode() || !hasSupabaseEnv();
}

// ─── Shift Templates ──────────────────────────────────────────

export async function upsertShiftTemplateAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const id          = formData.get("id")?.toString() || undefined;
    const code        = formData.get("code")?.toString().trim().toUpperCase() ?? "";
    const name        = formData.get("name")?.toString().trim() ?? "";
    const start_time  = formData.get("start_time")?.toString() ?? "";
    const end_time    = formData.get("end_time")?.toString() ?? "";
    const break_min   = Number(formData.get("break_minutes") ?? 0);
    const is_overnight = formData.get("is_overnight") === "true";
    const role_required = formData.get("role_required")?.toString().trim() || null;
    const min_staff   = Number(formData.get("min_staff") ?? 1);
    const max_staff   = formData.get("max_staff") ? Number(formData.get("max_staff")) : null;
    const color       = formData.get("color")?.toString() ?? "#6D5EF7";

    if (!code || !name || !start_time || !end_time) {
      return { ok: false, error: "Mã ca, tên ca, giờ bắt đầu và kết thúc là bắt buộc." };
    }

    await upsertShiftTemplate({
      id,
      code,
      name,
      start_time,
      end_time,
      break_minutes: break_min,
      is_overnight,
      role_required,
      min_staff,
      max_staff,
      color,
    } as Partial<ShiftTemplate> & { code: string; name: string; start_time: string; end_time: string });

    revalidatePath("/scheduling");
    revalidatePath("/scheduling/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

export async function deleteShiftTemplateAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteShiftTemplate(id);
    revalidatePath("/scheduling/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

// ─── Period & Shifts ──────────────────────────────────────────

export async function assignShiftAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const weekStart  = formData.get("week_start")?.toString() ?? "";
    const templateId = formData.get("template_id")?.toString() ?? "";
    const employeeId = formData.get("employee_id")?.toString() ?? "";
    const shiftDate  = formData.get("shift_date")?.toString() ?? "";

    if (!weekStart || !templateId || !employeeId || !shiftDate) {
      return { ok: false, error: "Thiếu thông tin bắt buộc." };
    }

    if (isDemo()) {
      demoAddShift({
        id: `ss-${Date.now()}`,
        employeeId,
        templateId,
        date: shiftDate,
        status: "scheduled",
      });
      revalidatePath("/scheduling");
      return { ok: true };
    }

    const period = await getOrCreatePeriod(weekStart);
    await assignShift({ periodId: period.id, templateId, employeeId, shiftDate });

    revalidatePath("/scheduling");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

export async function removeShiftAction(
  shiftId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (isDemo()) {
      demoCancelShift(shiftId);
      revalidatePath("/scheduling");
      return { ok: true };
    }

    await removeShift(shiftId);
    revalidatePath("/scheduling");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

export async function publishPeriodAction(
  periodId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await publishPeriod(periodId);
    revalidatePath("/scheduling");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

// ─── Swap Requests ────────────────────────────────────────────

export async function decideSwapAction(
  id: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await decideSwapRequest(id, decision, note);
    revalidatePath("/scheduling/swaps");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

export async function createSwapRequestAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const requesterShiftId = formData.get("requester_shift_id")?.toString() ?? "";
    const requestType      = (formData.get("request_type")?.toString() ?? "drop") as "drop" | "swap";
    const receiverShiftId  = formData.get("receiver_shift_id")?.toString() || undefined;
    const receiverId       = formData.get("receiver_id")?.toString() || undefined;
    const reason           = formData.get("reason")?.toString() || undefined;

    if (!requesterShiftId) return { ok: false, error: "Thiếu thông tin ca cần đổi." };

    await createSwapRequest({ requesterShiftId, requestType, receiverShiftId, receiverId, reason });
    revalidatePath("/scheduling/swaps");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}
