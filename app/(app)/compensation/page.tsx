import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { IncentiveSimulator } from "@/components/compensation/IncentiveSimulator";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchEmployees, fetchPayroll, fetchDepartments } from "@/lib/queries";
import { formatVND, formatCompactVND, formatPercent } from "@/lib/utils";
import type { PayrollEntry } from "@/types/domain";
import { Wallet, TrendingUp, Users, Gift, PiggyBank, Percent } from "lucide-react";

export default async function CompensationPage() {
  const { t } = await tServer();
  const [employees, payroll, departments] = await Promise.all([
    fetchEmployees(),
    fetchPayroll(),
    fetchDepartments(),
  ]);

  type Row = PayrollEntry & { name: string; dept: string };
  const rows: Row[] = payroll.map((p) => {
    const emp = employees.find((e) => e.id === p.employee_id);
    const dept = departments.find((d) => d.id === emp?.department_id);
    return { ...p, name: emp?.full_name ?? "—", dept: dept?.name ?? "—" };
  });

  const totalGross = payroll.reduce((s, p) => s + p.gross_pay, 0);
  const totalNet = payroll.reduce((s, p) => s + p.net_pay, 0);
  const totalCost = payroll.reduce((s, p) => s + p.company_cost, 0);
  const totalBonus = payroll.reduce((s, p) => s + p.bonus_total, 0);
  const totalCommission = payroll.reduce((s, p) => s + p.commission_total, 0);
  const avgCost = payroll.length ? totalCost / payroll.length : 0;

  // Breakdown donut
  const breakdownSegments = [
    { name: "Cơ bản", value: payroll.reduce((s, p) => s + p.base_salary, 0), color: "#6366f1" },
    { name: "Phụ cấp", value: payroll.reduce((s, p) => s + p.allowance_total, 0), color: "#8b5cf6" },
    { name: "Hoa hồng", value: totalCommission, color: "#10b981" },
    { name: "Bonus", value: totalBonus, color: "#f59e0b" },
    { name: "BHXH/Cost DN", value: totalCost - totalGross, color: "#ef4444" },
  ];
  const breakdownTotal = breakdownSegments.reduce((s, x) => s + x.value, 0) || 1;

  // Payroll by department
  const byDept = departments.map((d) => {
    const deptEmps = employees.filter((e) => e.department_id === d.id).map((e) => e.id);
    const sum = payroll
      .filter((p) => deptEmps.includes(p.employee_id))
      .reduce((s, p) => s + p.company_cost, 0);
    return {
      label: d.name,
      value: sum,
      max: Math.max(...departments.map((dd) => {
        const ids = employees.filter((e) => e.department_id === dd.id).map((e) => e.id);
        return payroll.filter((p) => ids.includes(p.employee_id)).reduce((s, p) => s + p.company_cost, 0);
      })),
      right: formatCompactVND(sum),
      color: "#6366f1",
    };
  });

  const columns: Column<Row>[] = [
    { key: "name", header: "Nhân sự", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "dept", header: "Phòng ban", render: (r) => r.dept },
    { key: "base", header: "Cơ bản", align: "right", render: (r) => formatCompactVND(r.base_salary) },
    { key: "commission", header: "Hoa hồng", align: "right", render: (r) => formatCompactVND(r.commission_total) },
    { key: "bonus", header: "Bonus", align: "right", render: (r) => formatCompactVND(r.bonus_total) },
    { key: "gross", header: "Gross", align: "right", render: (r) => formatVND(r.gross_pay) },
    { key: "net", header: "Net", align: "right", render: (r) => formatVND(r.net_pay) },
    { key: "cost", header: "Cost to company", align: "right", render: (r) => formatVND(r.company_cost) },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/compensation"
        title={t("comp.title")}
        description={t("comp.subtitle")}
        actions={<Badge variant="info">{t("common.draft")}</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Tổng gross" value={formatCompactVND(totalGross)} delta={3.2} accent="indigo" icon={<Wallet className="h-3.5 w-3.5" />} spark={[400, 420, 440, 470, 500, Math.round(totalGross / 1_000_000)].map((x) => x * 1_000_000)} />
        <KpiCard label="Tổng net" value={formatCompactVND(totalNet)} accent="emerald" icon={<Wallet className="h-3.5 w-3.5" />} />
        <KpiCard label="Cost to company" value={formatCompactVND(totalCost)} delta={2.8} accent="amber" icon={<PiggyBank className="h-3.5 w-3.5" />} />
        <KpiCard label="Bonus pool" value={formatCompactVND(totalBonus)} accent="violet" icon={<Gift className="h-3.5 w-3.5" />} />
        <KpiCard label="Commission" value={formatCompactVND(totalCommission)} accent="cyan" icon={<TrendingUp className="h-3.5 w-3.5" />} />
        <KpiCard label="TB / nhân sự" value={formatCompactVND(avgCost)} accent="rose" icon={<Users className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cơ cấu chi phí lương</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut
              value={100}
              label={formatCompactVND(breakdownTotal)}
              height={240}
              segments={breakdownSegments.map((s) => ({ ...s, value: (s.value / breakdownTotal) * 100 }))}
            />
            <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
              {breakdownSegments.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-medium">{formatCompactVND(s.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tỷ lệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Payroll / Revenue" value={formatPercent((totalCost / 5_200_000_000) * 100, 1)} tone="info" />
            <StatChip label="Bonus / Gross" value={formatPercent((totalBonus / totalGross) * 100, 1)} tone="violet" />
            <StatChip label="Commission / Gross" value={formatPercent((totalCommission / totalGross) * 100, 1)} tone="success" />
            <StatChip label="Variable / Fixed" value="28 : 72" tone="warning" />
          </CardContent>
        </Card>

        <div className="lg:col-span-4">
          <IncentiveSimulator />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payroll theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList rows={byDept} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="h-4 w-4 text-indigo-600" />
              Rule ngưỡng thưởng hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { min: "< 80%", mul: "0.0x", tone: "bg-red-50 text-red-700" },
                { min: "≥ 80%", mul: "0.5x", tone: "bg-orange-50 text-orange-700" },
                { min: "≥ 90%", mul: "0.75x", tone: "bg-amber-50 text-amber-700" },
                { min: "≥ 100%", mul: "1.0x", tone: "bg-emerald-50 text-emerald-700" },
                { min: "≥ 120%", mul: "1.5x", tone: "bg-indigo-50 text-indigo-700" },
              ].map((t) => (
                <div key={t.min} className={`rounded-lg p-3 ${t.tone}`}>
                  <div className="text-xs opacity-75">Hoàn thành KPI</div>
                  <div className="font-semibold">{t.min}</div>
                  <div className="text-xl font-bold mt-1">{t.mul}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              Công thức: <code className="text-xs">kpi_bonus = base × base_bonus_pct × multiplier</code>. Team và company multiplier cộng thêm.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Payroll chi tiết theo nhân sự</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
