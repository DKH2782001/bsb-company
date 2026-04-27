"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { saveUserPreferences, updateEmployeeAvatar, updateEmployeeProfile } from "@/lib/repositories/profile";
import { createClientOrNull, hasSupabaseEnv } from "@/lib/supabase/server";

type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function changePasswordAction(formData: FormData): Promise<ChangePasswordResult> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword.trim()) {
    return { ok: false, error: "Vui lòng nhập mật khẩu hiện tại." };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "Mật khẩu mới phải có ít nhất 8 ký tự." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Mật khẩu xác nhận không khớp." };
  }
  if (newPassword === currentPassword) {
    return { ok: false, error: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  }

  const rateLimit = await checkRateLimit({
    key: "auth:change-password",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Quá nhiều lần đổi mật khẩu. Thử lại sau ${rateLimit.retryAfterSeconds}s.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  if (!hasSupabaseEnv()) {
    return { ok: true };
  }

  const supabase = await createClientOrNull();
  if (!supabase) {
    return { ok: false, error: "Không khởi tạo được Supabase client." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return { ok: false, error: "Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reauthError) {
    return { ok: false, error: "Mật khẩu hiện tại không đúng." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await supabase.auth.signOut({ scope: "others" });

  revalidatePath("/profile");
  return { ok: true };
}

export async function updateProfileAction(formData: FormData) {
  await updateEmployeeProfile({
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    timezone: String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh"),
  });

  revalidatePath("/profile");
}

export async function updatePreferencesAction(formData: FormData) {
  await saveUserPreferences({
    locale: String(formData.get("locale") ?? "vi"),
    timezone: String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh"),
    dateFormat: String(formData.get("dateFormat") ?? "DD/MM/YYYY"),
    theme: String(formData.get("theme") ?? "light"),
    compactSidebar: formData.get("compactSidebar") === "on",
    notificationSettings: {
      email: formData.get("pref_email") === "on",
      push: formData.get("pref_push") === "on",
      kpiAlerts: formData.get("pref_kpiAlerts") === "on",
      approvals: formData.get("pref_approvals") === "on",
      reminders: formData.get("pref_reminders") === "on",
      periodicReports: formData.get("pref_periodicReports") === "on",
      securityAlerts: formData.get("pref_securityAlerts") === "on",
    },
  });

  revalidatePath("/profile");
}

export async function updateAvatarAction(formData: FormData) {
  await updateEmployeeAvatar({
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
    storagePath: String(formData.get("storagePath") ?? "") || null,
  });

  revalidatePath("/profile");
}

export async function signOutOtherSessionsAction() {
  const supabase = await createClientOrNull();
  if (supabase) {
    await supabase.auth.signOut({ scope: "others" });
  }

  revalidatePath("/profile");
  redirect("/profile?security=other-sessions-signed-out");
}
