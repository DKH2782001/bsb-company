import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiStatusBadge } from "@/components/kpi/KpiStatusBadge";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProgressList } from "@/components/widgets/ProgressList";
import { ActivityFeed } from "@/components/widgets/ActivityFeed";
import { StatChip } from "@/components/widgets/StatChip";
import {
  fetchEmployees,
  fetchDepartments,
  fetchKpis,
  fetchKpiTargets,
  fetchKpiActuals,
  fetchTasks,
  fetchPayroll,
} from "@/lib/queries";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { computePayroll } from "@/lib/compensation/ruleEngine";
import { formatVND, formatCompactVND, formatPercent } from "@/lib/utils";
import { Target, Wallet, TrendingUp, Award } from "lucide-react";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [employees, departments, kpis, targets, actuals, tasks, payroll] = await Promise.all([
    fetchEmployees(),
    fetchDepartments(),
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
    fetchTasks(),
    fetchPayroll(),
  ]);

  const emp = employees.find((e) => e.id === id);
  if (!emp) notFound();

  const dept = departments.find((d) => d.id === emp.department_id);
  const manager = employees.find((m) => m.id === emp.manager_id);

  const empKpiRows = buildKpiRows(
    kpis.filter((k) => k.owner_employee_id === emp.id),
    targets,
    actuals,
  );
  const empTasks = tasks.filter((t) => t.assignee_id === emp.id);
  const payrollEntry = payroll.find((p) => p.employee_id === emp.id);

  const avgCompletion = empKpiRows.length
    ? empKpiRows.reduce((s, r) => s + (r.completion ?? 0), 0) / empKpiRows.length
    : 1;
  const simulated = computePayroll({
    base_salary: emp.base_salary,
    allowance: Math.round(emp.base_salary * 0.05),
    kpi_completion: avgCompletion,
    team_completion: 0.95,
    company_completion: 0.91,
  });

  // 6-month performance trend
  const perfTrend = [
    { label: "T11", value: 82 },
    { label: "T12", value: 84 },
    { label: "T1", value: 86 },
    { label: "T2", value: 88 },
    { label: "T3", value: 90 },
    { label: "T4", value: Math.round(avgCompletion * 100) },
  ];

  const kpiColumns: Column<(typeof empKpiRows)[number]>[] = [
    { key: "name", header: "KPI", render: (r) => <Link href={`/kpi/${r.id}`} className="font-medium hover:text-indigo-700">{r.name}</Link> },
    { key: "weight", header: "Trọng số", align: "right", render: (r) => r.weight.toFixed(2) },
    { key: "target", header: "Target", align: "right", render: (r) => r.target?.toLocaleString("vi-VN") ?? "—" },
    { key: "actual", header: "Thực tế", align: "right", render: (r) => r.actual?.toLocaleString("vi-VN") ?? "—" },
    { key: "status", header: "", align: "right", render: (r) => <KpiStatusBadge status={r.status} completion={r.completion} /> },
  ];

  const taskColumns: Column<(typeof empTasks)[number]>[] = [
    { key: "title", header: "Task", render: (t) => t.title },
    { key: "priority", header: "Priority", render: (t) => <Badge variant={t.priority === "urgent" ? "danger" : "outline"}>{t.priority}</Badge> },
    { key: "due", header: "Hạn", render: (t) => t.due_date ?? "—" },
    { key: "status", header: "", align: "right", render: (t) => <Badge variant={t.status === "done" ? "success" : "outline"}>{t.status}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title={emp.full_name}
        description={`${dept?.name ?? "—"} · ${emp.code ?? ""} · ${emp.employment_type}`}
        actions={<Badge variant={emp.status === "active" ? "success" : "outline"}>{emp.status}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Profile card */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {emp.full_name.slice(0, 1)}
            </div>
            <div className="mt-3 font-semibold text-zinc-900">{emp.full_name}</div>
            <div className="text-xs text-zinc-500">{emp.email}</div>
            <Badge variant={emp.status === "active" ? "success" : "outline"} className="mt-2">
              {emp.status}
            </Badge>
            <div className="w-full mt-4 space-y-2 text-sm text-left">
              <Row k="Phòng ban" v={dept ? <Link href={`/departments/${dept.id}`} className="text-indigo-600">{dept.name}</Link> : "—"} />
              <Row k="Manager" v={manager?.full_name ?? "—"} />
              <Row k="Ngày vào" v={emp.join_date ?? "—"} />
              <Row k="Loại HĐ" v={emp.employment_type} />
              <Row k="Lương cơ bản" v={formatVND(emp.base_salary)} />
            </div>
          </CardContent>
        </Card>

        {/* Top metrics + completion donut */}
        <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="KPI TB"
            value={formatPercent(avgCompletion * 100, 0)}
            delta={4.1}
            accent="indigo"
            icon={<Target className="h-3.5 w-3.5" />}
            spark={perfTrend.map((p) => p.value)}
          />
          <KpiCard
            label="Task đang mở"
            value={String(empTasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length)}
            accent="violet"
          />
          <KpiCard
            label="Gross pay"
            value={formatCompactVND(simulated.gross_pay)}
            accent="emerald"
            icon={<Wallet className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Cost to company"
            value={formatCompactVND(simulated.company_cost)}
            accent="amber"
          />

          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hiệu suất 6 tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaTrend data={perfTrend} height={160} axisFormat="pct" color="#6366f1" />
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Compensation breakdown (mô phỏng)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <Row k="Lương cơ bản" v={formatVND(simulated.base_salary)} />
              <Row k="Phụ cấp" v={formatVND(simulated.allowance)} />
              <Row k="KPI bonus" v={formatVND(simulated.kpi_bonus)} />
              <Row k="Team bonus" v={formatVND(simulated.team_bonus)} />
              <Row k={<strong>Gross pay</strong>} v={<strong>{formatVND(simulated.gross_pay)}</strong>} />
              <Row k={<strong>Net pay</strong>} v={<strong>{formatVND(simulated.net_pay)}</strong>} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KPI cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={kpiColumns} rows={empKpiRows} empty="Chưa gán KPI" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              Kỹ năng & Chứng chỉ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={[
                { label: "Product knowledge", value: 85, max: 100, right: "85%", color: "#6366f1" },
                { label: "Communication", value: 92, max: 100, right: "92%", color: "#10b981" },
                { label: "Data analysis", value: 68, max: 100, right: "68%", color: "#f59e0b" },
                { label: "Tool mastery", value: 78, max: 100, right: "78%", color: "#8b5cf6" },
                { label: "Collaboration", value: 90, max: 100, right: "90%", color: "#06b6d4" },
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge variant="info">Google Ads Certified</Badge>
              <Badge variant="info">HubSpot Inbound</Badge>
              <Badge variant="outline">Meta Blueprint</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Task hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={taskColumns} rows={empTasks} empty="Không có task" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phản hồi gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              items={[
                { id: "1", actor: manager?.full_name ?? "Manager", action: "đánh giá hiệu suất: Vượt kỳ vọng", time: "1 tuần trước", avatarColor: "bg-emerald-600" },
                { id: "2", actor: "Nguyễn Văn A", action: "ghi nhận đóng góp vào KPI công ty", time: "2 tuần trước", avatarColor: "bg-indigo-600" },
                { id: "3", actor: manager?.full_name ?? "Manager", action: "gợi ý training Data Analysis", time: "3 tuần trước", avatarColor: "bg-violet-600" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Impact path — đóng góp lên KPI công ty</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="info">{emp.full_name}</Badge>
            <span className="text-zinc-400">→</span>
            {empKpiRows.slice(0, 2).map((k) => (
              <Badge key={k.id} variant="outline">
                {k.code}
              </Badge>
            ))}
            <span className="text-zinc-400">→</span>
            <Badge variant="outline">{dept?.name ?? "Dept"}</Badge>
            <span className="text-zinc-400">→</span>
            <Badge variant="success">KPI công ty</Badge>
            <span className="text-zinc-400">→</span>
            <Badge variant="info">Revenue / Profit</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            <StatChip label="Contribution weight" value="8.4%" tone="info" />
            <StatChip label="Revenue impact ước tính" value={formatCompactVND(emp.base_salary * 10)} tone="violet" />
            <StatChip label="KPI parent" value={empKpiRows[0]?.code ?? "—"} tone="default" />
            <StatChip label="Payroll entry kỳ này" value={payrollEntry ? formatCompactVND(payrollEntry.gross_pay) : "—"} tone="success" />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Nếu KPI cá nhân đạt đúng ngưỡng, KPI phòng ban và KPI công ty sẽ đạt theo công thức cascade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{k}</span>
      <span className="text-zinc-900">{v}</span>
    </div>
  );
}
