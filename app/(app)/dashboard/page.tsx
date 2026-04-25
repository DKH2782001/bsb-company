import Link from "next/link";
import {
  CircleDollarSign,
  TrendingUp,
  Wallet,
  Users,
  AlertTriangle,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { BarCompare } from "@/components/charts/BarCompare";
import { ProgressList } from "@/components/widgets/ProgressList";
import { ActivityFeed } from "@/components/widgets/ActivityFeed";
import { InsightCard } from "@/components/widgets/InsightCard";
import { StatChip } from "@/components/widgets/StatChip";
import {
  fetchKpis,
  fetchKpiTargets,
  fetchKpiActuals,
  fetchEmployees,
  fetchPayroll,
  fetchTasks,
  fetchAlerts,
  fetchAccounting,
  fetchDepartments,
  demo,
} from "@/lib/queries";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { formatCompactVND, formatPercent } from "@/lib/utils";

export const revalidate = 300;

export default async function DashboardPage() {
  const { t } = await tServer();
  const [kpis, targets, actuals, employees, payroll, tasks, alerts, entries, departments] = await Promise.all([
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
    fetchEmployees(),
    fetchPayroll(),
    fetchTasks(),
    fetchAlerts(),
    fetchAccounting(),
    fetchDepartments(),
  ]);

  const rows = buildKpiRows(kpis, targets, actuals);
  const gpRow = rows.find((r) => r.code === "GP");
  const npRow = rows.find((r) => r.code === "NP");

  const revenue = entries.filter((e) => e.account_code === "511").reduce((s, e) => s + e.credit, 0);
  const payrollCost = payroll.reduce((s, p) => s + p.company_cost, 0);
  const bonusPool = payroll.reduce((s, p) => s + p.bonus_total, 0);
  const companyKpis = rows.filter((r) => r.level === "company");
  const companyKpiAvg =
    companyKpis.reduce((s, r) => s + (r.completion ?? 0), 0) / Math.max(1, companyKpis.length);

  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < new Date("2026-04-23"),
  ).length;
  const taskWithKpi = tasks.filter((t) => t.linked_kpi_id).length;
  const kpiLinkPct = tasks.length ? Math.round((taskWithKpi / tasks.length) * 100) : 0;

  const deptRank = departments
    .map((d) => {
      const deptKpis = rows.filter((r) => r.owner_department_id === d.id);
      const avg =
        deptKpis.reduce((s, k) => s + (k.completion ?? 0), 0) / Math.max(1, deptKpis.length);
      return { label: d.name, target: 100, actual: Math.round(avg * 100) };
    })
    .sort((a, b) => b.actual - a.actual);

  const kpiDistro = [
    { name: "Xanh", value: rows.filter((r) => r.status === "green").length, color: "#10b981" },
    { name: "Vàng", value: rows.filter((r) => r.status === "yellow").length, color: "#f59e0b" },
    { name: "Đỏ", value: rows.filter((r) => r.status === "red").length, color: "#ef4444" },
    { name: "Chưa có", value: rows.filter((r) => r.status === "na").length, color: "#d4d4d8" },
  ];
  const totalKpiCount = kpiDistro.reduce((s, x) => s + x.value, 0);
  const donutSegments = kpiDistro.map((d) => ({
    ...d,
    value: totalKpiCount ? (d.value / totalKpiCount) * 100 : 0,
  }));

  const revenueSpark = demo.demoRevenueTrend.map((x) => Number(x.value));
  const gpSpark = revenueSpark.map((v) => Math.round(v * 0.36));
  const npSpark = revenueSpark.map((v) => Math.round(v * 0.14));
  const payrollSpark = [520, 530, 540, 548, 555, 560].map((x) => x * 1_000_000);
  const headcountSpark = [70, 72, 74, 76, 80, 84];
  const kpiSpark = [82, 85, 84, 88, 90, 91];

  const revProfit = [
    { label: "T11", revenue: 4500000000, profit: 600000000 },
    { label: "T12", revenue: 4700000000, profit: 650000000 },
    { label: "T1", revenue: 4600000000, profit: 590000000 },
    { label: "T2", revenue: 4850000000, profit: 680000000 },
    { label: "T3", revenue: 5000000000, profit: 710000000 },
    { label: "T4", revenue: 5200000000, profit: 720000000 },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/dashboard"
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        actions={<Badge variant="info">{t("common.updated")}</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard
          label="Doanh thu tháng"
          value={formatCompactVND(revenue)}
          delta={8.4}
          accent="indigo"
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          spark={revenueSpark}
        />
        <KpiCard
          label="Gross Profit"
          value={formatCompactVND(gpRow?.actual ?? 0)}
          delta={6.1}
          accent="emerald"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          spark={gpSpark}
        />
        <KpiCard
          label="Net Profit"
          value={formatCompactVND(npRow?.actual ?? 0)}
          delta={4.2}
          accent="violet"
          icon={<Wallet className="h-3.5 w-3.5" />}
          spark={npSpark}
        />
        <KpiCard
          label="KPI company"
          value={formatPercent(companyKpiAvg * 100, 0)}
          delta={2.3}
          accent="cyan"
          icon={<Target className="h-3.5 w-3.5" />}
          spark={kpiSpark}
        />
        <KpiCard
          label="Headcount"
          value={String(employees.length)}
          hint={`${departments.length} phòng ban`}
          accent="amber"
          icon={<Users className="h-3.5 w-3.5" />}
          spark={headcountSpark}
        />
        <KpiCard
          label="Payroll cost"
          value={formatCompactVND(payrollCost)}
          delta={-1.2}
          accent="rose"
          icon={<Wallet className="h-3.5 w-3.5" />}
          spark={payrollSpark}
        />
      </div>

      {/* Hero row: risk table | hero donut | trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Rủi ro KPI chi tiết</CardTitle>
            <Badge variant="danger">
              {rows.filter((r) => r.status === "red").length} đỏ
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1">
            {rows
              .filter((r) => r.status === "red" || r.status === "yellow")
              .slice(0, 6)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 truncate">{r.name}</div>
                    <div className="text-xs text-zinc-500 font-mono">{r.code}</div>
                  </div>
                  <Badge variant={r.status === "red" ? "danger" : "warning"}>
                    {Math.round((r.completion ?? 0) * 100)}%
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KPI company tổng</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pb-6">
            <KpiHeroDonut
              value={companyKpiAvg}
              label="Đạt KPI"
              segments={donutSegments}
              height={220}
            />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4 text-xs w-full max-w-[260px]">
              {kpiDistro.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-medium text-zinc-900">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Xu hướng doanh thu 12 tháng</CardTitle>
            <Badge variant="success">+8.4%</Badge>
          </CardHeader>
          <CardContent>
            <AreaTrend data={demo.demoRevenueTrend} height={220} axisFormat="vnd" />
          </CardContent>
        </Card>
      </div>

      {/* Second row: bar combined | task progress | incentive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Doanh thu vs Lợi nhuận 6 tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <BarCompare
              data={revProfit}
              bars={[
                { key: "revenue", name: "Doanh thu", color: "#6366f1" },
                { key: "profit", name: "Lợi nhuận", color: "#10b981" },
              ]}
              height={220}
              axisFormat="vnd"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tiến độ công việc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <StatChip label="Đang mở" value={openTasks} tone="info" />
              <StatChip label="Overdue" value={overdueTasks} tone="danger" />
              <StatChip label="On-time" value="91%" tone="success" />
            </div>
            <ProgressList
              rows={[
                { label: "Growth tasks", value: tasks.filter((t) => t.task_type === "growth").length, max: tasks.length, color: "#6366f1", right: `${tasks.filter((t) => t.task_type === "growth").length}/${tasks.length}` },
                { label: "Maintenance", value: tasks.filter((t) => t.task_type === "maintenance").length, max: tasks.length, color: "#8b5cf6" },
                { label: "Admin", value: tasks.filter((t) => t.task_type === "admin").length, max: tasks.length, color: "#f59e0b" },
                { label: "Urgent", value: tasks.filter((t) => t.task_type === "urgent").length, max: tasks.length, color: "#ef4444" },
              ]}
            />
            <div className="text-xs text-zinc-500">
              Có <strong className="text-zinc-900">{kpiLinkPct}%</strong> task gắn KPI.
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Incentive snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-zinc-900">
              {formatCompactVND(bonusPool)}
            </div>
            <div className="text-xs text-zinc-500">Bonus pool dự kiến kỳ này</div>
            <div className="h-px bg-zinc-100 my-2" />
            <div className="space-y-1.5 text-sm">
              <Row k="Tổng gross" v={formatCompactVND(payroll.reduce((s, p) => s + p.gross_pay, 0))} />
              <Row k="Tổng net" v={formatCompactVND(payroll.reduce((s, p) => s + p.net_pay, 0))} />
              <Row
                k="Payroll / Revenue"
                v={formatPercent((payrollCost / Math.max(1, revenue)) * 100, 1)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third row: dept ranking | alerts | activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Xếp hạng phòng ban theo KPI</CardTitle>
          </CardHeader>
          <CardContent>
            <BarCompare
              data={deptRank}
              bars={[
                { key: "target", name: "Target", color: "#e4e4e7" },
                { key: "actual", name: "Thực tế", color: "#6366f1" },
              ]}
              height={220}
              axisFormat="pct"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Cảnh báo đang mở</CardTitle>
            <Link href="/alerts" className="text-xs text-indigo-600">
              Xem tất cả →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    a.severity === "critical" || a.severity === "danger"
                      ? "bg-red-500"
                      : a.severity === "warning"
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-800 truncate">{a.title}</div>
                  <div className="text-xs text-zinc-400">
                    {new Date(a.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
                <Badge
                  variant={
                    a.severity === "critical" || a.severity === "danger"
                      ? "danger"
                      : a.severity === "warning"
                        ? "warning"
                        : "info"
                  }
                  className="shrink-0"
                >
                  {a.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              items={[
                { id: "1", actor: "Nguyễn Văn A", action: "duyệt bonus tháng 4", time: "2 phút trước", avatarColor: "bg-indigo-600" },
                { id: "2", actor: "Trần Thị B", action: "tạo job requisition Senior Sales", time: "15 phút trước", avatarColor: "bg-violet-600" },
                { id: "3", actor: "Lê Văn C", action: "override payroll cho Nguyễn Hải H", time: "1 giờ trước", avatarColor: "bg-amber-500" },
                { id: "4", actor: "Hoàng Minh E", action: "cập nhật target MKT.LEADS", time: "2 giờ trước", avatarColor: "bg-emerald-600" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Insight row */}
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-zinc-900">Insight đầu cuối</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InsightCard
          title="Lead marketing tăng 8%, dự kiến revenue +2.1%"
          description="Nếu CPL hiện tại giữ nguyên trong tuần tới, revenue tháng sau có thể vượt 5.4 tỷ."
          spark={[40, 42, 45, 48, 50, 54]}
          accent="#6366f1"
          tag="+8%"
        />
        <InsightCard
          title="Close rate Sales còn 54% — dưới mục tiêu 8%"
          description="Kiểm tra qualification từ Marketing; xét điều chỉnh threshold hoặc training inbound."
          spark={[65, 62, 60, 58, 56, 54]}
          accent="#ef4444"
          tag="-8%"
        />
        <InsightCard
          title="Payroll / Revenue ở 10.8% — tối ưu"
          description="Giữ tỉ lệ này dưới 12% khi tuyển 4 vị trí mới trong Q2."
          spark={[12, 11.5, 11.2, 11, 10.9, 10.8]}
          accent="#10b981"
          tag="OK"
        />
      </div>

      {/* Bottom row: finance snapshot + risk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              Execution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Task đang mở" v={String(openTasks)} />
            <Row k="Task overdue" v={<span className="text-red-600 font-medium">{overdueTasks}</span>} />
            <Row k="% task gắn KPI" v={`${kpiLinkPct}%`} />
            <Row k="On-time rate" v="91%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-violet-600" />
              Finance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Cash balance" v={formatCompactVND(18_400_000_000)} />
            <Row k="AR" v={formatCompactVND(3_200_000_000)} />
            <Row k="AP" v={formatCompactVND(1_100_000_000)} />
            <Row k="Runway" v="11.5 tháng" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Rủi ro doanh thu (what-if)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Sales hụt 20%" v={<span className="text-red-600">-1.04 tỷ NP</span>} />
            <Row k="Payroll +15%" v={<span className="text-red-600">-90 triệu margin</span>} />
            <Row k="Retention -5%" v={<span className="text-red-600">-280 triệu LTV</span>} />
            <Row k="CPL giảm 10%" v={<span className="text-emerald-600">+54 leads</span>} />
          </CardContent>
        </Card>
      </div>
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
