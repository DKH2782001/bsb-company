import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProgressList } from "@/components/widgets/ProgressList";
import { fetchEmployees, fetchDepartments, fetchKpis } from "@/lib/queries";
import { createEmployeeAction } from "@/app/(app)/workspace/actions";
import { formatCompactVND } from "@/lib/utils";
import { Users, UserPlus, Briefcase, TrendingUp } from "lucide-react";
import type { Employee } from "@/types/domain";

export default async function PeoplePage() {
  const { t } = await tServer();
  const [employees, departments, kpis] = await Promise.all([
    fetchEmployees(),
    fetchDepartments(),
    fetchKpis(),
  ]);

  type Row = Employee & { dept_name: string; manager_name: string; kpi_count: number };
  const rows: Row[] = employees.map((e) => ({
    ...e,
    dept_name: departments.find((d) => d.id === e.department_id)?.name ?? "—",
    manager_name: employees.find((m) => m.id === e.manager_id)?.full_name ?? "—",
    kpi_count: kpis.filter((k) => k.owner_employee_id === e.id).length,
  }));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Nhân sự",
      render: (e) => (
        <Link href={`/people/${e.id}`} className="flex items-center gap-3 hover:text-indigo-700">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {e.full_name.slice(0, 1)}
          </div>
          <div>
            <div className="font-medium text-zinc-900">{e.full_name}</div>
            <div className="text-xs text-zinc-500">{e.email}</div>
          </div>
        </Link>
      ),
    },
    { key: "dept", header: "Phòng ban", render: (e) => e.dept_name },
    { key: "manager", header: "Manager", render: (e) => e.manager_name },
    {
      key: "salary",
      header: "Lương cơ bản",
      align: "right",
      render: (e) => formatCompactVND(e.base_salary),
    },
    { key: "kpi", header: "KPI", align: "right", render: (e) => String(e.kpi_count) },
    {
      key: "status",
      header: "",
      align: "right",
      render: (e) => (
        <Badge variant={e.status === "active" ? "success" : "outline"}>{e.status}</Badge>
      ),
    },
  ];

  const active = employees.filter((e) => e.status === "active").length;
  const totalPayroll = employees.reduce((s, e) => s + e.base_salary, 0);
  const deptCounts = departments.map((d) => ({
    label: d.name,
    value: employees.filter((e) => e.department_id === d.id).length,
    max: employees.length,
    right: `${employees.filter((e) => e.department_id === d.id).length} người`,
    color: "#6366f1",
  }));

  return (
    <div>
      <PageHeader
        helpKey="/people"
        title={t("people.title")}
        description={t("people.subtitle")}
        actions={<Button>{t("people.addNew")}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <KpiCard
          label="Tổng nhân sự"
          value={String(employees.length)}
          accent="indigo"
          icon={<Users className="h-3.5 w-3.5" />}
          spark={[10, 11, 12, 12, 13, employees.length]}
          delta={3.1}
        />
        <KpiCard
          label="Đang làm việc"
          value={String(active)}
          accent="emerald"
          icon={<Users className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Phòng ban"
          value={String(departments.length)}
          accent="violet"
          icon={<Briefcase className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Quỹ lương"
          value={formatCompactVND(totalPayroll)}
          accent="amber"
          spark={[380, 400, 420, 440, 450, Math.round(totalPayroll / 1_000_000)].map((x) => x * 1_000_000)}
        />
        <KpiCard
          label="Mới tháng 4"
          value="3"
          hint="1 HR, 1 Ops, 1 CS"
          accent="rose"
          icon={<UserPlus className="h-3.5 w-3.5" />}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Thêm nhân sự mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEmployeeAction} className="grid gap-3 md:grid-cols-6">
            <Input name="fullName" placeholder="Họ tên" required />
            <Input name="email" type="email" placeholder="Email công việc" required />
            <select name="departmentId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
              <option value="">Chọn phòng ban</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <select name="managerId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
              <option value="">Chọn manager</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.full_name}</option>
              ))}
            </select>
            <Input name="baseSalary" type="number" placeholder="Lương cơ bản" required />
            <Button type="submit">Tạo nhân sự</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phân bổ theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList rows={deptCounts} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={[
                { label: "Xuất sắc (≥ 110%)", value: 3, max: employees.length, right: "3", color: "#10b981" },
                { label: "Đạt (90-109%)", value: 8, max: employees.length, right: "8", color: "#6366f1" },
                { label: "Cải thiện (< 90%)", value: 2, max: employees.length, right: "2", color: "#f59e0b" },
                { label: "Yếu (< 80%)", value: 1, max: employees.length, right: "1", color: "#ef4444" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Top 5 performer tháng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employees.slice(0, 5).map((e, i) => (
              <Link
                key={e.id}
                href={`/people/${e.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-100 p-2 hover:bg-zinc-50"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {e.full_name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-zinc-900 truncate">{e.full_name}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {departments.find((d) => d.id === e.department_id)?.name ?? "—"}
                  </div>
                </div>
                <Badge variant={i === 0 ? "success" : "outline"}>
                  {110 - i * 4}%
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Danh sách toàn bộ</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
