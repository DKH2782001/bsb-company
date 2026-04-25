import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiStatusBadge } from "@/components/kpi/KpiStatusBadge";
import { KpiTreeGraph } from "@/components/kpi/KpiTreeGraphLazy";
import { ProgressList } from "@/components/widgets/ProgressList";
import { InsightCard } from "@/components/widgets/InsightCard";
import { StatChip } from "@/components/widgets/StatChip";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { fetchKpis, fetchKpiTargets, fetchKpiActuals, fetchTasks, fetchEmployees } from "@/lib/queries";
import { createKpiAction, recordKpiActualAction } from "@/app/(app)/workspace/actions";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { Target } from "lucide-react";

export default async function KpiPage() {
  const { t } = await tServer();
  const [kpis, targets, actuals, tasks, employees] = await Promise.all([
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
    fetchTasks(),
    fetchEmployees(),
  ]);
  const rows = buildKpiRows(kpis, targets, actuals);

  const companyRows = rows.filter((r) => r.level === "company");
  const deptRows = rows.filter((r) => r.level === "department");
  const redCount = rows.filter((r) => r.status === "red").length;
  const yellowCount = rows.filter((r) => r.status === "yellow").length;
  const greenCount = rows.filter((r) => r.status === "green").length;

  // "Lead card" highlight — pick the biggest funnel contributor (MKT.LEADS)
  const leadKpi = rows.find((r) => r.code === "MKT.LEADS");
  const leadActual = leadKpi?.actual ?? 0;
  const leadTarget = leadKpi?.target ?? 0;
  const leadPct = leadTarget ? Math.round((leadActual / leadTarget) * 100) : 0;

  const topImpactKpis = rows
    .filter((r) => r.level !== "company" && r.completion != null)
    .sort((a, b) => (b.weight * (b.completion ?? 0)) - (a.weight * (a.completion ?? 0)))
    .slice(0, 4);

  const missingData = rows.filter((r) => r.actual == null);
  const tasksByKpi = kpis
    .map((k) => ({
      kpi: k,
      count: tasks.filter((t) => t.linked_kpi_id === k.id).length,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "name",
      header: "KPI",
      render: (r) => (
        <Link href={`/kpi/${r.id}`} className="font-medium hover:text-indigo-700">
          {r.name}
          <div className="text-xs text-zinc-500 font-mono">{r.code}</div>
        </Link>
      ),
    },
    { key: "level", header: "Cấp", render: (r) => <Badge variant="outline">{r.level}</Badge> },
    { key: "unit", header: "Đơn vị", render: (r) => r.unit },
    { key: "weight", header: "Trọng số", align: "right", render: (r) => r.weight.toFixed(2) },
    {
      key: "target",
      header: "Target",
      align: "right",
      render: (r) => r.target?.toLocaleString("vi-VN") ?? "—",
    },
    {
      key: "actual",
      header: "Thực tế",
      align: "right",
      render: (r) => r.actual?.toLocaleString("vi-VN") ?? "—",
    },
    {
      key: "status",
      header: "",
      align: "right",
      render: (r) => <KpiStatusBadge status={r.status} completion={r.completion} />,
    },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/kpi"
        title={t("kpi.title")}
        description={t("kpi.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="info">{t("topbar.period")}</Badge>
            <Link href="/forecast">
              <Button variant="outline" size="sm">
                {t("kpi.openForecast")}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top KPI company cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
        {companyRows.slice(0, 4).map((r) => (
          <KpiCard
            key={r.id}
            label={r.name}
            value={r.completion != null ? `${Math.round(r.completion * 100)}%` : "—"}
            hint={r.code ?? undefined}
            accent={r.status === "green" ? "emerald" : r.status === "yellow" ? "amber" : r.status === "red" ? "red" : "indigo"}
            icon={<Target className="h-3.5 w-3.5" />}
            spark={[76, 80, 82, 85, 88, Math.round((r.completion ?? 0.9) * 100)]}
            delta={r.status === "green" ? 2.1 : r.status === "yellow" ? -1.4 : -5.2}
          />
        ))}
        <Card className="p-4 flex flex-col">
          <div className="text-xs font-medium text-zinc-500">KPI còn lại</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
            {rows.length - companyRows.length}
          </div>
          <div className="text-xs text-zinc-400">cấp phòng + team + cá nhân</div>
          <div className="grid grid-cols-3 gap-1.5 mt-auto pt-3 text-[10px]">
            <Badge variant="success" className="justify-center">
              {greenCount}
            </Badge>
            <Badge variant="warning" className="justify-center">
              {yellowCount}
            </Badge>
            <Badge variant="danger" className="justify-center">
              {redCount}
            </Badge>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Tạo KPI mới</CardTitle></CardHeader>
          <CardContent>
            <form action={createKpiAction} className="grid gap-3 md:grid-cols-4">
              <Input name="name" placeholder="Tên KPI" required />
              <Input name="code" placeholder="Mã KPI" />
              <select name="level" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="department">Department</option>
                <option value="company">Company</option>
                <option value="team">Team</option>
                <option value="employee">Employee</option>
              </select>
              <Input name="unit" placeholder="Đơn vị" defaultValue="%" />
              <select name="ownerEmployeeId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="">Owner nhân sự</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                ))}
              </select>
              <select name="parentKpiId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="">KPI cha</option>
                {kpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>{kpi.code ?? kpi.name}</option>
                ))}
              </select>
              <Input name="targetValue" type="number" placeholder="Target kỳ hiện tại" />
              <Button type="submit">Tạo KPI</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Ghi actual KPI</CardTitle></CardHeader>
          <CardContent>
            <form action={recordKpiActualAction} className="grid gap-3 md:grid-cols-4">
              <select name="kpiId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="">Chọn KPI</option>
                {kpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>{kpi.code ?? kpi.name}</option>
                ))}
              </select>
              <Input name="period" defaultValue="2026-04" />
              <Input name="actualValue" type="number" placeholder="Actual value" required />
              <Button type="submit">Lưu actual</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Main: tree + lead card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Cây KPI công ty</CardTitle>
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="success">{greenCount} green</Badge>
              <Badge variant="warning">{yellowCount} yellow</Badge>
              <Badge variant="danger">{redCount} red</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <KpiTreeGraph rows={rows} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lead card · MKT.LEADS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-bold text-zinc-900">
                {leadActual.toLocaleString("vi-VN")}
              </div>
              <div className="text-sm text-zinc-500 mb-1">leads</div>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Target {leadTarget.toLocaleString("vi-VN")} · đạt{" "}
              <span className="text-emerald-600 font-medium">{leadPct}%</span>
            </div>
            <div className="h-2 mt-3 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${Math.min(100, leadPct)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <StatChip label="CPL" value="478k" tone="warning" />
              <StatChip label="MQL → SQL" value="28%" tone="success" />
            </div>

            <div className="mt-4 text-xs text-zinc-500 font-medium">KPI đóng góp ngược</div>
            <ProgressList
              className="mt-2"
              rows={[
                { label: "Content output", value: 62, max: 60, color: "#10b981", right: "62/60" },
                { label: "Performance ads", value: 420, max: 400, color: "#f59e0b", right: "420k / 400k" },
                { label: "Lead qualification", value: 78, max: 85, color: "#6366f1", right: "78/85" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* 2nd row: top impact | tasks by KPI | missing data | dept progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top KPI ảnh hưởng lớn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topImpactKpis.map((k) => (
              <Link
                href={`/kpi/${k.id}`}
                key={k.id}
                className="block rounded-lg border border-zinc-100 p-2 hover:bg-zinc-50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-900 truncate pr-2">{k.name}</span>
                  <KpiStatusBadge status={k.status} completion={k.completion} />
                </div>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                  {k.code} · trọng số {k.weight.toFixed(2)}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Task đang gắn KPI</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={tasksByKpi.map((x) => ({
                label: x.kpi.name,
                value: x.count,
                max: Math.max(...tasksByKpi.map((y) => y.count)),
                right: `${x.count} task`,
                color: "#6366f1",
              }))}
            />
            <div className="text-xs text-zinc-500 mt-3">
              {tasks.filter((t) => t.linked_kpi_id).length}/{tasks.length} task đã có linked_kpi_id.
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KPI thiếu dữ liệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingData.length === 0 && (
              <div className="text-xs text-zinc-500">Tất cả KPI đã có actual trong kỳ.</div>
            )}
            {missingData.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-dashed border-zinc-200 px-2 py-1.5 text-sm"
              >
                <span className="text-zinc-700 truncate">{r.name}</span>
                <Badge variant="outline">{r.data_source ?? "—"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tiến độ KPI theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={deptRows.slice(0, 6).map((r) => ({
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
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InsightCard
          title="KPI close rate đang dưới 85% — cần action"
          description="Nhân viên có KPI đỏ: 1. Kiểm tra pipeline và training inbound."
          spark={[65, 62, 60, 58, 56, 54]}
          accent="#ef4444"
          tag="đỏ"
        />
        <InsightCard
          title={`${employees.length} nhân sự — mỗi người đạt TB ${Math.round(rows.filter((r) => r.level === "employee").reduce((s, r) => s + (r.completion ?? 0), 0) / Math.max(1, rows.filter((r) => r.level === "employee").length) * 100)}%`}
          description="Cá nhân đóng góp lên KPI phòng ban theo công thức cascade có trọng số."
          spark={[80, 84, 85, 88, 90, 92]}
          accent="#6366f1"
          tag="cá nhân"
        />
        <InsightCard
          title="Chạy Forecast để xem 'sales hụt 20%'"
          description="Simulator cho phép thay đổi KPI lá, propagate lên Revenue / Gross Profit / Net Profit."
          spark={[50, 48, 52, 55, 57, 60]}
          accent="#10b981"
          tag="→ /forecast"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Danh sách toàn bộ KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
