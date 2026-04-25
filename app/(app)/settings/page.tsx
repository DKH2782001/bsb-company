import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/kpi/KpiCard";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchCompany, fetchDepartments, fetchEmployees } from "@/lib/queries";
import { updateCompanySettingsAction } from "@/app/(app)/workspace/actions";
import {
  Building2,
  Users,
  Target,
  Wallet,
  Shield,
  Plug,
  Database,
  Settings as SettingsIcon,
  FileText,
} from "lucide-react";

export default async function SettingsPage() {
  const { t } = await tServer();
  const [company, departments, employees] = await Promise.all([fetchCompany(), fetchDepartments(), fetchEmployees()]);

  return (
    <div>
      <PageHeader helpKey="/settings" title={t("settings.title")} description={t("settings.subtitle")} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Company" value={company.name} accent="indigo" icon={<Building2 className="h-3.5 w-3.5" />} />
        <KpiCard label="Phòng ban" value={String(departments.length)} accent="violet" icon={<Users className="h-3.5 w-3.5" />} />
        <KpiCard label="Role" value="7" accent="emerald" icon={<Shield className="h-3.5 w-3.5" />} />
        <KpiCard label="KPI formulas" value="3" accent="amber" icon={<Target className="h-3.5 w-3.5" />} />
        <KpiCard label="Bonus rules" value="1" accent="cyan" icon={<Wallet className="h-3.5 w-3.5" />} />
        <KpiCard label="Integrations" value="2/5" accent="rose" icon={<Plug className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-sm">Thông tin công ty</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <form action={updateCompanySettingsAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tên công ty</Label>
                <Input name="name" defaultValue={company.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Mã công ty</Label>
                <Input name="code" defaultValue={company.code ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input name="currency" defaultValue={company.currency} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Input name="timezone" defaultValue={company.timezone} />
                </div>
              </div>
              <Button className="w-full" type="submit">Lưu thay đổi</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-sm">Cơ cấu tổ chức</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {departments.map((d) => {
              const count = employees.filter((e) => e.department_id === d.id).length;
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 p-2.5"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 truncate">{d.name}</div>
                    <div className="text-xs text-zinc-500">{count} người · {d.code}</div>
                  </div>
                  <Button size="sm" variant="outline">
                    Sửa
                  </Button>
                </div>
              );
            })}
            <Button variant="secondary" className="w-full">
              + Thêm phòng ban
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-sm">Phân quyền (7 role)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { role: "CEO / Founder", count: 1, tone: "danger" as const, scope: "Full" },
              { role: "CFO", count: 1, tone: "warning" as const, scope: "Finance full" },
              { role: "HR Admin", count: 1, tone: "info" as const, scope: "People, Payroll" },
              { role: "Department Head", count: 6, tone: "info" as const, scope: "Dept scope" },
              { role: "Team Lead", count: 4, tone: "outline" as const, scope: "Team scope" },
              { role: "Employee", count: 14, tone: "outline" as const, scope: "Self" },
              { role: "Auditor", count: 0, tone: "outline" as const, scope: "Read-only" },
            ].map((r) => (
              <div
                key={r.role}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-2.5"
              >
                <div className="min-w-0">
                  <div className="text-zinc-700">{r.role}</div>
                  <div className="text-[10px] text-zinc-400">{r.scope}</div>
                </div>
                <Badge variant={r.tone}>{r.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-sm">KPI Formula Engine</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-xs text-zinc-500">
              Hỗ trợ: sum, sub, mul, avg, weighted_avg, ratio, milestone, ref, const, manual.
            </div>
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-2.5">
              <code className="text-xs text-zinc-700 font-mono">
                {`{op:"mul",args:[{ref:"mql"},{ref:"close"}]}`}
              </code>
            </div>
            <StatChip label="KPI tree integrity" value="100%" tone="success" />
            <StatChip label="KPI thiếu dữ liệu" value="0" tone="success" />
            <Button variant="outline" className="w-full">
              Mở formula editor
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-sm">Compensation Policies</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-xs text-zinc-500">
              Salary template · Bonus rules · Commission · Team multiplier · Company multiplier.
            </div>
            <div className="grid grid-cols-5 gap-1">
              {["0x", "0.5x", "0.75x", "1x", "1.5x"].map((m, i) => (
                <div
                  key={m}
                  className={`rounded-md text-center text-[10px] font-bold py-1 ${
                    i < 2 ? "bg-red-50 text-red-700" : i < 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {m}
                </div>
              ))}
            </div>
            <StatChip label="Base bonus %" value="15%" tone="info" />
            <StatChip label="Team multiplier" value="1.0x" tone="default" />
            <Button variant="outline" className="w-full">
              Mở rule designer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-sm">Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { name: "Google Sheets", active: true },
              { name: "Accounting (MISA)", active: false },
              { name: "CRM (HubSpot)", active: false },
              { name: "Chấm công (Timmi)", active: true },
              { name: "POS / ERP", active: false },
            ].map((i) => (
              <div
                key={i.name}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-2.5"
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-700">{i.name}</span>
                </div>
                <Badge variant={i.active ? "success" : "outline"}>
                  {i.active ? "ON" : "OFF"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-sm">Hệ thống</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Audit log retention" value="12 tháng" tone="info" />
            <StatChip label="Auto snapshot" value="Daily 02:00" tone="success" />
            <StatChip label="Backup database" value="Daily (Supabase)" tone="success" />
            <StatChip label="SSO" value="Chưa bật" tone="warning" />
            <StatChip label="IP allowlist" value="Tắt" tone="default" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-sm">Import jobs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { name: "employees_2026_04.csv", status: "done", tone: "success" as const },
              { name: "kpi_actuals_2026_Q1.csv", status: "done", tone: "success" as const },
              { name: "payroll_2026_03.xlsx", status: "running", tone: "info" as const },
            ].map((j) => (
              <div
                key={j.name}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-2.5"
              >
                <span className="text-zinc-700 font-mono text-xs truncate">{j.name}</span>
                <Badge variant={j.tone}>{j.status}</Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              + Import CSV / Sheets
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
