"use server";

import { revalidatePath } from "next/cache";
import { saveUserPreferences, updateEmployeeProfile } from "@/lib/repositories/profile";

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
