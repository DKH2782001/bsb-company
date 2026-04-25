import { logout } from "@/app/(auth)/actions";
import { updatePreferencesAction, updateProfileAction } from "./actions";
import { fetchProfileData } from "@/lib/queries";
import { formatDateVN } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import { SettingsListRow } from "@/components/shared/SettingsListRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bell,
  CheckCircle2,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  Monitor,
  Shield,
  Smartphone,
} from "lucide-react";

const roleLabel: Record<string, string> = {
  ceo: "CEO",
  cfo: "Finance Viewer",
  hr_admin: "Admin",
  dept_head: "Department Head",
  team_lead: "Team Lead",
  employee: "Employee",
  auditor: "Approval Manager",
};

const roleTone: Record<string, "info" | "warning" | "success" | "outline"> = {
  ceo: "info",
  cfo: "warning",
  hr_admin: "info",
  dept_head: "success",
  team_lead: "outline",
  employee: "outline",
  auditor: "success",
};

export default async function ProfilePage() {
  const data = await fetchProfileData();
  const authUser = data.authUser;
  const employee = data.employee;
  const preference = data.preferences;
  const notificationSettings = normalizeNotificationSettings(preference.notification_settings);
  const securitySettings =
    preference && typeof preference === "object" && "security_settings" in preference
      ? preference.security_settings
      : null;
  const sessions = data.sessions;
  const recentActivity = data.notifications;
  const integrations = data.integrations;
  const roles = data.roles;

  const profileCompletion = Math.min(
    100,
    [employee?.full_name, employee?.phone, employee?.email, employee?.department_id, employee?.position_id].filter(Boolean).length * 20,
  );
  const securityScore = Math.min(
    100,
    (notificationSettings.securityAlerts ? 20 : 0) +
      (securitySettings && typeof securitySettings === "object" ? 65 : 45),
  );

  const metrics = [
    { label: "Hồ sơ hoàn thiện", value: `${profileCompletion}%`, hint: "↑ 8% so với tháng trước", icon: <Shield className="h-4 w-4" /> },
    { label: "Thiết bị hoạt động", value: String(sessions.length || 4), hint: "↑ 1 thiết bị mới", icon: <Laptop className="h-4 w-4" /> },
    { label: "Phiên đăng nhập", value: String(sessions.length || 6), hint: "↑ 2 phiên hôm nay", icon: <Monitor className="h-4 w-4" /> },
    { label: "Bảo mật", value: securityScore >= 80 ? "Mạnh" : "Trung bình", hint: "↑ Mức độ bảo mật cao", icon: <Shield className="h-4 w-4" /> },
    { label: "Thông báo bật", value: String(Object.values(notificationSettings).filter(Boolean).length), hint: "↑ 2 thông báo mới", icon: <Bell className="h-4 w-4" /> },
    { label: "2FA", value: "Đã kích hoạt", hint: "Bảo vệ tài khoản của bạn", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader helpKey="/profile" title="Tài khoản cá nhân" description="Trang chủ > Tài khoản cá nhân" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--brand-600)]">
                {metric.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-soft)]">{metric.label}</div>
                <div className="mt-1 text-[17px] font-bold text-[var(--text-strong)]">{metric.value}</div>
                <div className="mt-1 text-[11px] text-emerald-600">{metric.hint}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1.45fr_0.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5 flex items-center gap-4 border-b border-[var(--line-soft)] pb-4 text-sm">
              {["Hồ sơ cơ bản", "Liên hệ", "Chữ ký điện tử"].map((tab, index) => (
                <div
                  key={tab}
                  className={index === 0 ? "border-b-2 border-[var(--brand-600)] pb-3 font-semibold text-[var(--brand-700)]" : "pb-3 text-[var(--text-soft)]"}
                >
                  {tab}
                </div>
              ))}
            </div>

            <form action={updateProfileAction} className="grid gap-5 lg:grid-cols-[160px_1fr]">
              <div className="flex flex-col items-center gap-4">
                <EntityAvatar name={employee?.full_name ?? "Người dùng demo"} size="lg" />
                <Button variant="outline" className="w-full">
                  Chỉnh sửa hồ sơ
                </Button>
              </div>

              <div className="grid gap-3">
                <ProfileField label="Họ tên" name="fullName" defaultValue={employee?.full_name ?? (authUser?.user_metadata?.full_name as string) ?? ""} />
                <StaticField label="Chức danh" value="CEO" />
                <StaticField label="Email công việc" value={employee?.email ?? authUser?.email ?? "demo@bizos.local"} />
                <ProfileField label="Số điện thoại" name="phone" defaultValue={employee?.phone ?? ""} />
                <StaticField label="Phòng ban" value={employee?.department_id ? "Ban Giám đốc" : "Chưa gán"} />
                <StaticField label="Mã nhân sự" value={employee?.code ?? "NV00001"} />
                <StaticField label="Ngày tham gia" value={formatDateVN(employee?.join_date ?? "2024-04-01")} />
                <ProfileField label="Múi giờ" name="timezone" defaultValue={preference.timezone ?? "Asia/Ho_Chi_Minh"} />
                <div className="pt-2">
                  <Button type="submit" className="w-full lg:w-[220px]">
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Bảo mật tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="flex flex-col items-center justify-center">
                <SecurityDonut score={securityScore} />
                <div className="mt-3 text-xs text-[var(--text-soft)]">Mức độ bảo mật</div>
              </div>
              <div className="space-y-3">
                <SettingsListRow
                  icon={<KeyRound className="h-4 w-4" />}
                  title="Đổi mật khẩu"
                  hint="Cập nhật 20/05/2024"
                  action="Cập nhật"
                />
                <SettingsListRow
                  icon={<Shield className="h-4 w-4" />}
                  title="Xác thực 2 lớp (2FA)"
                  hint="Đã kích hoạt"
                  status="success"
                />
                <SettingsListRow
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Câu hỏi bảo mật"
                  hint="Đã thiết lập"
                  action="Quản lý"
                />
                <SettingsListRow
                  icon={<Mail className="h-4 w-4" />}
                  title="Phương thức khôi phục"
                  hint="Email, SĐT dự phòng"
                  action="Xem"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Tùy chọn hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updatePreferencesAction} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <PreferenceField label="Ngôn ngữ" name="locale" defaultValue={preference.locale ?? "vi"} />
                  <PreferenceField label="Múi giờ" name="timezone" defaultValue={preference.timezone ?? "Asia/Ho_Chi_Minh"} />
                  <PreferenceField label="Định dạng ngày" name="dateFormat" defaultValue={preference.date_format ?? "DD/MM/YYYY"} />
                  <PreferenceField label="Giao diện" name="theme" defaultValue={preference.theme ?? "light"} />
                </div>

                <div className="rounded-[22px] bg-[var(--surface-alt)] p-4">
                  <label className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-strong)]">Chế độ sidebar thu gọn</div>
                      <div className="text-xs text-[var(--text-soft)]">Thu gọn sidebar để tăng không gian làm việc</div>
                    </div>
                    <input name="compactSidebar" type="checkbox" defaultChecked={Boolean(preference.compact_sidebar)} className="h-5 w-5 rounded border-[var(--line-soft)] text-[var(--brand-600)] focus:ring-[var(--brand-500)]" />
                  </label>
                </div>

                <Button type="submit" className="w-full">
                  Lưu cài đặt
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Quyền truy cập hiện có</CardTitle>
                <span className="text-xs font-medium text-[var(--brand-600)]">Quản lý</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {roles.map((role) => (
                <div key={`${role.role}-${role.scope_department_id ?? "global"}`} className="flex items-center justify-between rounded-[20px] border border-[var(--line-soft)] p-3">
                  <div>
                    <Badge variant={roleTone[role.role] ?? "outline"}>{roleLabel[role.role] ?? role.role}</Badge>
                    <div className="mt-2 text-xs text-[var(--text-soft)]">
                      {role.scope_department_id ? `Scope ${role.scope_department_id}` : "Quyền cao nhất"}
                    </div>
                  </div>
                  <Badge variant="success">Hoạt động</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Thiết bị đăng nhập</CardTitle>
                <span className="text-xs font-medium text-[var(--brand-600)]">Xem tất cả</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-start gap-3 rounded-[20px] border border-[var(--line-soft)] p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--brand-600)]">
                    {session.platform?.toLowerCase().includes("ios") ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[var(--text-strong)]">{session.device_label}</div>
                      {session.is_current && <Badge variant="success">Đang hoạt động</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      {[session.platform, session.browser].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      {session.location_label} · {formatDateVN(session.last_seen_at)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1.05fr_0.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Tùy chọn thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updatePreferencesAction} className="space-y-3">
              <input type="hidden" name="locale" value={preference.locale ?? "vi"} />
              <input type="hidden" name="timezone" value={preference.timezone ?? "Asia/Ho_Chi_Minh"} />
              <input type="hidden" name="dateFormat" value={preference.date_format ?? "DD/MM/YYYY"} />
              <input type="hidden" name="theme" value={preference.theme ?? "light"} />
              {notificationRows.map((row) => (
                <label key={row.key} className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--line-soft)] p-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-strong)]">{row.label}</div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">{row.hint}</div>
                  </div>
                  <input
                    name={`pref_${row.key}`}
                    type="checkbox"
                    defaultChecked={notificationSettings[row.key]}
                    className="h-5 w-5 rounded border-[var(--line-soft)] text-[var(--brand-600)] focus:ring-[var(--brand-500)]"
                  />
                </label>
              ))}
              <Button type="submit" className="w-full">
                Lưu tùy chọn
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Ứng dụng kết nối</CardTitle>
              <span className="text-xs font-medium text-[var(--brand-600)]">Quản lý</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((integration) => (
              <div key={integration.provider} className="flex items-center justify-between rounded-[20px] border border-[var(--line-soft)] p-3.5">
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-strong)]">{integration.provider}</div>
                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                    {typeof integration.config === "object" && integration.config && "workspace" in integration.config
                      ? String(integration.config.workspace)
                      : "Workspace đang kết nối"}
                  </div>
                </div>
                <Badge variant={integration.active ? "success" : "outline"}>
                  {integration.active ? "Đã kết nối" : "Chưa kết nối"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Hoạt động gần đây</CardTitle>
              <span className="text-xs font-medium text-[var(--brand-600)]">Xem tất cả</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((item) => (
              <div key={`${item.title}-${item.created_at}`} className="flex gap-3 rounded-[20px] border border-[var(--line-soft)] p-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--brand-600)]" />
                <div className="min-w-0">
                  <div className="text-sm text-[var(--text-strong)]">{item.title}</div>
                  <div className="mt-1 text-xs text-[var(--text-soft)]">{item.body ?? formatDateVN(item.created_at)}</div>
                </div>
              </div>
            ))}

            <form action={logout}>
              <Button variant="outline" className="mt-2 w-full">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <Input name={name} defaultValue={defaultValue} />
    </label>
  );
}

function PreferenceField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <Input name={name} defaultValue={defaultValue} />
    </label>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <div className="flex min-h-11 items-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] px-3.5 text-sm text-[var(--text-strong)]">
        {value}
      </div>
    </div>
  );
}

function SecurityDonut({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 52;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width="156" height="156" viewBox="0 0 156 156" className="overflow-visible">
      <circle cx="78" cy="78" r="52" fill="none" stroke="#E6EAFC" strokeWidth="12" />
      <circle
        cx="78"
        cy="78"
        r="52"
        fill="none"
        stroke="#1BB56B"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 78 78)"
      />
      <text x="78" y="73" textAnchor="middle" className="fill-[var(--text-strong)] text-[32px] font-bold">
        {score}
      </text>
      <text x="78" y="95" textAnchor="middle" className="fill-[var(--text-soft)] text-[11px]">
        /100
      </text>
      <text x="78" y="113" textAnchor="middle" className="fill-[#1BB56B] text-[12px] font-semibold">
        Mạnh
      </text>
    </svg>
  );
}

function normalizeNotificationSettings(settings: unknown) {
  const base = {
    email: true,
    push: true,
    kpiAlerts: true,
    approvals: true,
    reminders: true,
    periodicReports: true,
    securityAlerts: true,
  };

  if (!settings || typeof settings !== "object") return base;
  return { ...base, ...(settings as Record<string, boolean>) };
}

const notificationRows = [
  { key: "email", label: "Email notifications", hint: "Nhận thông báo qua email công việc" },
  { key: "push", label: "Push notifications", hint: "Thông báo trên trình duyệt và di động" },
  { key: "kpiAlerts", label: "Cảnh báo KPI", hint: "Nhận cảnh báo khi KPI vượt ngưỡng" },
  { key: "approvals", label: "Phê duyệt cần xử lý", hint: "Thông báo khi có yêu cầu phê duyệt mới" },
  { key: "reminders", label: "Nhắc lịch họp", hint: "Nhận nhắc trước giờ họp" },
  { key: "periodicReports", label: "Báo cáo định kỳ", hint: "Nhận báo cáo tổng hợp theo lịch" },
  { key: "securityAlerts", label: "Cảnh báo bảo mật", hint: "Thông báo về đăng nhập và bảo mật" },
] as const;
