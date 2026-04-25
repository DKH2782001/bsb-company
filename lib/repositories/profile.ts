import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

type ProfileScreenData = {
  authUser: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  employee: (typeof demo.demoEmployees)[number] | null;
  roles: Array<{ role: string; scope_department_id: string | null }>;
  preferences: {
    locale: string;
    timezone: string;
    date_format: string;
    theme: string;
    compact_sidebar: boolean;
    notification_settings: Record<string, boolean>;
    security_settings?: Record<string, unknown>;
  };
  integrations: Array<{ provider: string; active: boolean; config: Record<string, unknown> }>;
  notifications: Array<{ title: string; body: string | null; link: string | null; created_at: string }>;
  sessions: Array<{
    id: string;
    device_label: string;
    platform: string | null;
    browser: string | null;
    location_label: string | null;
    ip_address: string | null;
    last_seen_at: string;
    is_current: boolean;
  }>;
};

const demoNotificationSettings = {
  email: true,
  push: true,
  kpiAlerts: true,
  approvals: true,
  reminders: true,
  periodicReports: true,
  securityAlerts: true,
};

export type UserPreferenceInput = {
  locale: string;
  timezone: string;
  dateFormat: string;
  theme: string;
  compactSidebar: boolean;
  notificationSettings: Record<string, boolean>;
};

export async function getProfileScreenData() {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);

  return withDemoFallback<ProfileScreenData>(
    {
      authUser: user,
      employee: demo.demoEmployees[0],
      roles: [
        { role: "ceo", scope_department_id: null },
        { role: "hr_admin", scope_department_id: null },
        { role: "cfo", scope_department_id: null },
      ],
      preferences: {
        locale: "vi",
        timezone: "Asia/Ho_Chi_Minh",
        date_format: "DD/MM/YYYY",
        theme: "light",
        compact_sidebar: false,
        notification_settings: demoNotificationSettings,
      },
      integrations: [
        { provider: "Google Workspace", active: true, config: { workspace: "BIZOS Workspace", email: "nguyenvana@company.com" } },
        { provider: "Slack", active: true, config: { workspace: "BIZOS Workspace" } },
        { provider: "Notion", active: true, config: { workspace: "BIZOS Team" } },
        { provider: "CRM System", active: true, config: { workspace: "bizos-crm.company.com" } },
      ],
      notifications: [
        { title: "Cập nhật hồ sơ cá nhân", body: "01/06/2024 09:15", link: null, created_at: "2026-04-23T09:15:00Z" },
        { title: "Đổi mật khẩu thành công", body: "30/05/2024 18:30", link: null, created_at: "2026-04-22T18:30:00Z" },
        { title: "Bật xác thực 2 lớp (2FA)", body: "20/05/2024 10:22", link: null, created_at: "2026-04-20T10:22:00Z" },
      ],
      sessions: [
        { id: "s1", device_label: "MacBook Pro 16", platform: "macOS", browser: "Chrome", location_label: "Hà Nội, Việt Nam", ip_address: "31.05.2024 21:42", last_seen_at: "2026-04-24T09:15:00Z", is_current: true },
        { id: "s2", device_label: "iPhone 14 Pro", platform: "iOS 17.5", browser: "Safari", location_label: "Hà Nội, Việt Nam", ip_address: null, last_seen_at: "2026-04-24T06:15:00Z", is_current: false },
        { id: "s3", device_label: "Office Desktop", platform: "Windows 11", browser: "Chrome", location_label: "Hồ Chí Minh, Việt Nam", ip_address: null, last_seen_at: "2026-04-22T09:12:00Z", is_current: false },
      ],
    },
    async (db) => {
      if (!user || !context.companyId) {
        throw new Error("Không tìm thấy user context.");
      }

      const [{ data: employee }, { data: roles }, { data: preferences }, { data: integrations }, { data: notifications }, { data: sessions }] =
        await Promise.all([
          db.from("employees").select("*").eq("auth_user_id", user.id).maybeSingle(),
          db.from("user_roles").select("role, scope_department_id").eq("auth_user_id", user.id),
          db.from("user_preferences").select("*").eq("auth_user_id", user.id).maybeSingle(),
          db.from("integrations").select("*").eq("company_id", context.companyId).order("provider"),
          db.from("notifications").select("*").eq("auth_user_id", user.id).order("created_at", { ascending: false }).limit(6),
          db.from("user_sessions").select("*").eq("auth_user_id", user.id).order("last_seen_at", { ascending: false }).limit(6),
        ]);

      return {
        authUser: user,
        employee: employee ?? null,
        roles: roles ?? [],
        preferences: preferences ?? {
          locale: "vi",
          timezone: "Asia/Ho_Chi_Minh",
          date_format: "DD/MM/YYYY",
          theme: "light",
          compact_sidebar: false,
          notification_settings: demoNotificationSettings,
        },
        integrations: integrations ?? [],
        notifications: notifications ?? [],
        sessions: sessions ?? [],
      };
    },
  );
}

export async function updateEmployeeProfile(input: { fullName: string; phone: string; timezone: string }) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!user || !context.companyId) return;

  const db = await getDbClientOrThrow();
  const { data } = await db
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const current = (data as { id: string; full_name?: string; phone?: string | null } | null) ?? null;
  const employeesTable = db.from("employees") as unknown as {
    update: (values: { full_name: string; phone: string }) => {
      eq: (column: string, value: string) => Promise<unknown>;
    };
  };
  const preferencesTable = db.from("user_preferences") as unknown as {
    upsert: (values: Record<string, unknown>) => Promise<unknown>;
  };

  if (current) {
    await employeesTable.update({ full_name: input.fullName, phone: input.phone }).eq("id", current.id);
  }

  await preferencesTable.upsert({
      company_id: context.companyId,
      auth_user_id: user.id,
      timezone: input.timezone,
      locale: "vi",
      date_format: "DD/MM/YYYY",
      theme: "light",
      compact_sidebar: false,
      notification_settings: demoNotificationSettings,
      security_settings: {},
    });

  await writeAuditLog({
    action: "profile.update",
    entity: "employees",
    entityId: current?.id,
    before: current ?? null,
    after: { ...(current ?? {}), full_name: input.fullName, phone: input.phone, timezone: input.timezone },
  });
}

export async function saveUserPreferences(input: UserPreferenceInput) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!user || !context.companyId) return;

  const db = await getDbClientOrThrow();
  const { data } = await db
    .from("user_preferences")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const current = (data as { id?: string; security_settings?: Record<string, unknown> } | null) ?? null;
  const preferencesTable = db.from("user_preferences") as unknown as {
    upsert: (values: Record<string, unknown>) => Promise<unknown>;
  };

  const next = {
    company_id: context.companyId,
    auth_user_id: user.id,
    locale: input.locale,
    timezone: input.timezone,
    date_format: input.dateFormat,
    theme: input.theme,
    compact_sidebar: input.compactSidebar,
    notification_settings: input.notificationSettings,
    security_settings: (current?.security_settings ?? {}) as Record<string, unknown>,
  };

  await preferencesTable.upsert(next);

  await writeAuditLog({
    action: "profile.preferences.update",
    entity: "user_preferences",
    entityId: current?.id ?? null,
    before: current ?? null,
    after: next,
  });
}
