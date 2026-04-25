import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { KpiStatusBadge } from "@/components/kpi/KpiStatusBadge";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProgressList } from "@/components/widgets/ProgressList";
import { ActivityFeed } from "@/components/widgets/ActivityFeed";
import { StatChip } from "@/components/widgets/StatChip";
import {
  fetchDepartments,
  fetchEmployees,
  fetchKpis,
  fetchKpiActuals,
  fetchKpiTargets,
  fetchTasks,
  fetchPayroll,
} from "@/lib/queries";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { formatCompactVND, formatPercent } from "@/lib/utils";
import { Users, Wallet, Target, ListChecks, AlertTriangle } from "lucide-react";
import type { Employee } from "@/types/domain";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [departments, employees, kpis, targets, actuals, tasks, payroll] = await Promise.all([
    fetchDepartments(),
    fetchEmployees(),
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
    fetchTasks(),
    fetchPayroll(),
  ]);

  const dept = departments.find((d) => d.id === id);
  if (!dept) notFound();

  const head = employees.find((e) => e.id === dept.head_employee_id);
  const deptEmployees = employees.filter((e) => e.department_id === dept.id);
  const deptKpis = buildKpiRows(
    kpis.filter(
      (k) => k.owner_department_id === dept.id || deptEmployees.some((e) => e.id === k.owner_employee_id),
    ),
    targets,
    actuals,
  );
  const deptTasks = tasks.filter((t) => t.department_id === dept.id);
  const deptPayrollCost = payroll
    .filter((p) => deptEmployees.some((e) => e.id === p.employee_id))
    .reduce((s, p) => s + p.company_cost, 0);

  const avgCompletion = deptKpis.length
    ? deptKpis.reduce((s, r) => s + (r.completion ?? 0), 0) / deptKpis.length
    : 0;

  const taskTypeSegments = [
    { name: "Growth", value: deptTasks.filter((t) => t.task_type === "growth").length, color: "#6366f1" },
    { name: "Maintenance", value: deptTasks.filter((t) => t.task_type === "maintenance").length, color: "#8b5cf6" },
    { name: "Admin", value: deptTasks.filter((t) => t.task_type === "admin").length, color: "#f59e0b" },
    { name: "Urgent", value: deptTasks.filter((t) => t.task_type === "urgent").length, color: "#ef4444" },
  ];
  const totalTasks = deptTasks.length || 1;

  const kpiColumns: Column<(typeof deptKpis)[number]>[] = [
    { key: "name", header: "KPI", render: (r) => <Link href={`/kpi/${r.id}`} className="font-medium hover:text-indigo-700">{r.name}</Link> },
    { key: "code", header: "Mã", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "target", header: "Target", align: "right", render: (r) => (r.target != null ? r.target.toLocaleString("vi-VN") : "—") },
    { key: "actual", header: "Thực tế", align: "right", render: (r) => (r.actual != null ? r.actual.toLocaleString("vi-VN") : "—") },
    {
      key: "status",
      header: "",
      align: "right",
      render: (r) => <KpiStatusBadge status={r.status} completion={r.completion} />,
    },
  ];

  type EmpRow = Employee & { kpi_count: number };
  const empRows: EmpRow[] = deptEmployees.map((e) => ({
    ...e,
    kpi_count: kpis.filter((k) => k.owner_employee_id === e.id).length,
  }));

  const empColumns: Column<EmpRow>[] = [
    {
      key: "name",
      header: "Nhân sự",
      render: (e) => (
        <Link href={`/people/${e.id}`} className="font-medium hover:text-indigo-700">
          {e.full_name}
          <div className="text-xs text-zinc-500">{e.email}</div>
        </Link>
      ),
    },
    { key: "salary", header: "Lương cơ bản", align: "right", render: (e) => formatCompactVND(e.base_salary) },
    { key: "kpi", header: "KPI", align: "right", render: (e) => String(e.kpi_count) },
    {
      key: "status",
      header: "",
      align: "right",
      render: (e) => <Badge variant={e.status === "active" ? "success" : "outline"}>{e.status}</Badge>,
    },
  ];

  const taskColumns: Column<(typeof deptTasks)[number]>[] = [
    { key: "title", header: "Task", render: (t) => <span className="font-medium">{t.title}</span> },
    {
      key: "assignee",
      header: "Người nhận",
      render: (t) => employees.find((e) => e.id === t.assignee_id)?.full_name ?? "—",
    },
    { key: "due", header: "Hạn", render: (t) => t.due_date ?? "—" },
    {
      key: "status",
      header: "",
      align: "right",
      render: (t) => (
        <Badge variant={t.status === "done" ? "success" : t.status === "blocked" ? "danger" : "outline"}>
          {t.status}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={dept.name}
        description={dept.scope ?? `Phòng ban · ${dept.code}`}
        actions={<Badge variant="info">{dept.code}</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard
          label="Head"
          value={head?.full_name ?? "—"}
          accent="indigo"
        />
        <KpiCard
          label="Nhân sự"
          value={String(deptEmployees.length)}
          accent="violet"
          icon={<Users className="h-3.5 w-3.5" />}
          spark={[4, 5, 5, 5, 6, deptEmployees.length]}
        />
        <KpiCard
          label="Budget/tháng"
          value={formatCompactVND(dept.budget_monthly)}
          accent="amber"
          icon={<Wallet className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Payroll cost"
          value={formatCompactVND(deptPayrollCost)}
          accent="red"
          icon={<Wallet className="h-3.5 w-3.5" />}
          spark={[180, 200, 210, 220, 230, Math.round(deptPayrollCost / 1_000_000)].map((x) => x * 1_000_000)}
        />
        <KpiCard
          label="KPI TB"
          value={formatPercent(avgCompletion * 100, 0)}
          accent="emerald"
          icon={<Target className="h-3.5 w-3.5" />}
          spark={[70, 75, 80, 82, 85, Math.round(avgCompletion * 100)]}
        />
        <KpiCard
          label="Task đang mở"
          value={String(deptTasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length)}
          accent="cyan"
          icon={<ListChecks className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KPI completion phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut value={avgCompletion} label="Trung bình" height={200} />
            <ProgressList
              className="mt-4"
              rows={deptKpis.slice(0, 5).map((r) => ({
                label: r.name,
                value: Math.round((r.completion ?? 0) * 100),
                max: 100,
                right: `${Math.round((r.completion ?? 0) * 100)}%`,
                color:
                  r.status === "green" ? "#10b981" : r.status === "yellow" ? "#f59e0b" : "#ef4444",
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KPI chi tiết</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={kpiColumns} rows={deptKpis} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phân bổ task theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut
              value={deptTasks.length}
              label="Tổng task"
              height={180}
              segments={taskTypeSegments.map((s) => ({ ...s, value: (s.value / totalTasks) * 100 }))}
            />
            <div className="mt-3 space-y-1 text-xs">
              {taskTypeSegments.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nhân sự phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={empColumns} rows={empRows} empty="Phòng ban chưa có nhân sự" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Task đang chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={taskColumns} rows={deptTasks} empty="Không có task" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hoạt động gần đây của phòng</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              items={[
                { id: "1", actor: head?.full_name ?? "Head", action: "cập nhật target tháng 5", time: "hôm qua", avatarColor: "bg-indigo-600" },
                { id: "2", actor: deptEmployees[1]?.full_name ?? "—", action: "hoàn thành task KPI tuần", time: "2 ngày trước", avatarColor: "bg-emerald-600" },
                { id: "3", actor: head?.full_name ?? "Head", action: "thêm 1 specialist mới", time: "1 tuần trước", avatarColor: "bg-violet-600" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Cảnh báo phát sinh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="KPI đỏ" value={deptKpis.filter((k) => k.status === "red").length} tone="danger" />
            <StatChip label="KPI vàng" value={deptKpis.filter((k) => k.status === "yellow").length} tone="warning" />
            <StatChip label="Task overdue" value={deptTasks.filter((t) => t.status !== "done" && t.due_date && new Date(t.due_date) < new Date("2026-04-23")).length} tone="danger" />
            <StatChip label="Task blocked" value={deptTasks.filter((t) => t.status === "blocked").length} tone="warning" />
            <StatChip label="Budget dùng" value={formatPercent((deptPayrollCost / dept.budget_monthly) * 100, 1)} tone="info" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
