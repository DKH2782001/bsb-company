import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { BarCompare } from "@/components/charts/BarCompare";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { AccountingEntriesManager } from "@/components/finance/AccountingEntriesManager";
import { fetchAccounting, fetchPayroll, fetchDepartments, demo } from "@/lib/queries";
import { formatCompactVND, formatPercent, formatVND } from "@/lib/utils";
import { CircleDollarSign, TrendingUp, Wallet, Landmark, PiggyBank, Percent } from "lucide-react";

export const revalidate = 300;

export default async function FinancePage() {
  const { t } = await tServer();
  const [entries, payroll, departments] = await Promise.all([
    fetchAccounting(),
    fetchPayroll(),
    fetchDepartments(),
  ]);

  const revenue = entries.filter((e) => e.account_code === "511").reduce((s, e) => s + e.credit, 0);
  const cogs = entries.filter((e) => e.account_code === "632").reduce((s, e) => s + e.debit, 0);
  const sellingExp = entries.filter((e) => e.account_code === "641").reduce((s, e) => s + e.debit, 0);
  const adminExp = entries.filter((e) => e.account_code === "642").reduce((s, e) => s + e.debit, 0);
  const payrollExp = payroll.reduce((s, p) => s + p.company_cost, 0);

  const grossProfit = revenue - cogs;
  const opex = sellingExp + adminExp + payrollExp;
  const netProfit = grossProfit - opex;
  const netMargin = revenue ? (netProfit / revenue) * 100 : 0;

  const costSegments = departments.map((d, i) => ({
    name: d.name,
    value: d.budget_monthly,
    color: ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"][i % 6],
  }));

  const revCost = demo.demoRevenueTrend.slice(-6).map((r) => ({
    label: r.label,
    revenue: r.value,
    cost: Math.round(Number(r.value) * 0.68),
    profit: Math.round(Number(r.value) * 0.15),
  }));

  const sparkRevenue = demo.demoRevenueTrend.map((x) => Number(x.value));
  const sparkGP = sparkRevenue.map((v) => Math.round(v * 0.36));
  const sparkNP = sparkRevenue.map((v) => Math.round(v * 0.14));
  const sparkPayroll = [520, 528, 540, 550, 558, Math.round(payrollExp / 1_000_000)].map((x) => x * 1_000_000);
  const sparkOpex = [1200, 1250, 1280, 1320, 1380, Math.round(opex / 1_000_000)].map((x) => x * 1_000_000);

  return (
    <div>
      <PageHeader
        helpKey="/finance"
        title={t("finance.title")}
        description={t("finance.subtitle")}
        actions={<Badge variant="info">YTD</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard
          label="Doanh thu"
          value={formatCompactVND(revenue)}
          delta={8.4}
          accent="indigo"
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          spark={sparkRevenue}
        />
        <KpiCard
          label="Gross Profit"
          value={formatCompactVND(grossProfit)}
          delta={6.1}
          accent="emerald"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          spark={sparkGP}
        />
        <KpiCard
          label="Net Profit"
          value={formatCompactVND(netProfit)}
          delta={4.2}
          accent="violet"
          icon={<PiggyBank className="h-3.5 w-3.5" />}
          spark={sparkNP}
        />
        <KpiCard
          label="Net margin"
          value={formatPercent(netMargin, 1)}
          delta={0.8}
          accent="cyan"
          icon={<Percent className="h-3.5 w-3.5" />}
          spark={[10, 11, 11.5, 12, 13, Math.round(netMargin * 10) / 10]}
        />
        <KpiCard
          label="Payroll cost"
          value={formatCompactVND(payrollExp)}
          delta={-1.2}
          accent="amber"
          icon={<Wallet className="h-3.5 w-3.5" />}
          spark={sparkPayroll}
        />
        <KpiCard
          label="Tổng OPEX"
          value={formatCompactVND(opex)}
          delta={3.4}
          accent="rose"
          icon={<Landmark className="h-3.5 w-3.5" />}
          spark={sparkOpex}
        />
      </div>

      <Card className="mb-6 border-indigo-100 bg-indigo-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Luồng thu / chi đang dùng cho P&amp;L</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Thu</div>
            <div className="mt-1 font-semibold text-zinc-900">TK 511 credit - Doanh thu</div>
            <div className="mt-2 text-zinc-600">
              Bút toán có TK 511 và phát sinh Có được cộng vào doanh thu. Đây là nguồn cho KPI doanh thu và P&amp;L.
            </div>
            <div className="mt-3 text-lg font-bold text-emerald-700">{formatVND(revenue)}</div>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-600">Chi vận hành</div>
            <div className="mt-1 font-semibold text-zinc-900">TK 632 / 641 / 642 debit</div>
            <div className="mt-2 text-zinc-600">
              Giá vốn, chi phí bán hàng và chi phí quản lý được lấy từ phát sinh Nợ của các tài khoản chi phí.
            </div>
            <div className="mt-3 text-lg font-bold text-red-700">{formatVND(cogs + sellingExp + adminExp)}</div>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">Chi nhân sự</div>
            <div className="mt-1 font-semibold text-zinc-900">Payroll company cost</div>
            <div className="mt-2 text-zinc-600">
              Chi phí lương không nhập lẫn vào doanh thu. Hệ thống lấy từ payroll cost và cộng vào OPEX.
            </div>
            <div className="mt-3 text-lg font-bold text-amber-700">{formatVND(payrollExp)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Bút toán kế toán</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountingEntriesManager
            rows={entries.map((e) => ({
              ...e,
              dept_name: departments.find((d) => d.id === e.department_id)?.name ?? "—",
            }))}
            departments={departments}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Doanh thu - Chi phí - Lợi nhuận 6 tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <BarCompare
              data={revCost}
              bars={[
                { key: "revenue", name: "Doanh thu", color: "#6366f1" },
                { key: "cost", name: "Chi phí", color: "#ef4444" },
                { key: "profit", name: "Lợi nhuận", color: "#10b981" },
              ]}
              height={260}
              axisFormat="vnd"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cơ cấu chi phí theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut
              value={100}
              label={`${formatCompactVND(departments.reduce((s, d) => s + d.budget_monthly, 0))} / tháng`}
              height={220}
              segments={costSegments.map((c) => ({
                ...c,
                value:
                  (c.value / departments.reduce((s, d) => s + d.budget_monthly, 0)) * 100,
              }))}
            />
            <div className="grid grid-cols-2 gap-1.5 mt-4 text-xs">
              {costSegments.map((s) => (
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Xu hướng doanh thu 12 tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrend data={demo.demoRevenueTrend} height={240} axisFormat="vnd" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tỉ lệ tài chính quan trọng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Gross margin" value={formatPercent((grossProfit / revenue) * 100, 1)} tone="success" />
            <StatChip label="Net margin" value={formatPercent(netMargin, 1)} tone="info" />
            <StatChip label="Payroll / Revenue" value={formatPercent((payrollExp / revenue) * 100, 1)} tone="warning" />
            <StatChip label="OPEX / Revenue" value={formatPercent((opex / revenue) * 100, 1)} tone="default" />
            <StatChip label="AR turnover" value="12.4 lần" tone="violet" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mini P&L</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <Row k="Doanh thu" v={formatVND(revenue)} />
            <Row k="Giá vốn" v={`-${formatVND(cogs)}`} />
            <Row k={<strong>Gross Profit</strong>} v={<strong>{formatVND(grossProfit)}</strong>} />
            <Row k="Chi phí bán hàng" v={`-${formatVND(sellingExp)}`} />
            <Row k="Chi phí quản lý" v={`-${formatVND(adminExp)}`} />
            <Row k="Payroll cost" v={`-${formatVND(payrollExp)}`} />
            <Row k={<strong>Net Profit</strong>} v={<strong>{formatVND(netProfit)}</strong>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mini Balance Sheet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <Row k="Tiền mặt + NH" v={formatVND(18_400_000_000)} />
            <Row k="Phải thu" v={formatVND(3_200_000_000)} />
            <Row k="Tồn kho" v={formatVND(1_800_000_000)} />
            <Row k={<strong>Tổng TS</strong>} v={<strong>{formatVND(23_400_000_000)}</strong>} />
            <Row k="Nợ phải trả" v={formatVND(2_770_000_000)} />
            <Row k="Vốn chủ" v={formatVND(21_740_000_000)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mini Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1.5">
            <Row k="OCF" v={formatVND(1_800_000_000)} />
            <Row k="ICF" v={`-${formatVND(250_000_000)}`} />
            <Row k="FCF" v={formatVND(0)} />
            <Row k={<strong>Net cash</strong>} v={<strong>{formatVND(1_550_000_000)}</strong>} />
            <Row k="Runway" v="11.5 tháng" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Chi phí thực tế vs budget theo phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressList
            rows={departments.map((d, i) => {
              const factor = 0.85 + (i * 0.04);
              const actual = Math.round(d.budget_monthly * factor);
              const pct = Math.round((actual / d.budget_monthly) * 100);
              return {
                label: d.name,
                value: actual,
                max: d.budget_monthly,
                right: `${formatCompactVND(actual)} / ${formatCompactVND(d.budget_monthly)} (${pct}%)`,
                color: pct > 100 ? "#ef4444" : pct > 95 ? "#f59e0b" : "#10b981",
              };
            })}
          />
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
