import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { Simulator } from "@/components/forecast/Simulator";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchKpis, fetchKpiTargets, fetchKpiActuals, fetchKpiFormulas } from "@/lib/queries";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { TrendingUp, Target, BarChart3, LineChart } from "lucide-react";
import { getAuthenticatedUser, getUserContext } from "@/lib/repositories/shared";
import { requirePageRole } from "@/lib/auth/permissions";

export default async function ForecastPage() {
  const ctx = await getUserContext(await getAuthenticatedUser());
  requirePageRole(ctx, "/forecast");

  const { t } = await tServer();
  const [kpis, targets, actuals, formulas] = await Promise.all([
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
    fetchKpiFormulas(),
  ]);
  const rows = buildKpiRows(kpis, targets, actuals, formulas);

  return (
    <div>
      <PageHeader
        helpKey="/forecast"
        title={t("forecast.title")}
        description={t("forecast.subtitle")}
        actions={<Badge variant="info">Simulator live</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="KPI lá có thể điều chỉnh"
          value={String(rows.filter((row) => row.level === "employee" || row.level === "department").length)}
          accent="indigo"
          icon={<Target className="h-3.5 w-3.5" />}
        />
        <KpiCard label="KPI công ty" value={String(rows.filter((row) => row.level === "company").length)} accent="emerald" />
        <KpiCard label="Cascade depth" value="3 tầng" accent="violet" icon={<LineChart className="h-3.5 w-3.5" />} />
        <KpiCard
          label="Scenarios đã lưu"
          value="0"
          accent="amber"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          hint="feature sắp ra"
        />
      </div>

      <Simulator rows={rows} formulas={formulas} />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Câu hỏi mẫu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-700">
            <div className="rounded-lg bg-red-50 p-2.5 text-red-900">
              <strong>Sales hụt 20%:</strong> kéo slider SAL.CLOSE hoặc E8.CLOSE/E9.CLOSE xuống -20%.
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-900">
              <strong>Marketing giảm CPL:</strong> kéo E11.CPL xuống -10% xem CAC cải thiện bao nhiêu.
            </div>
            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-900">
              <strong>Operations siết SLA:</strong> kéo OPS.SLA lên +5% xem Gross Profit.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Engine cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-600">
            <p>
              Simulator clone <code className="text-xs">kpi_actuals</code>, áp delta vào từng KPI lá, rồi tính lại
              KPI cha theo đúng mode `sum`, `ratio`, `formula`, `manual`.
            </p>
            <p>
              Công thức chạy trong <code className="text-xs">lib/kpi/cascade.simulateImpact()</code> — chạy trên
              client, không ảnh hưởng data thật.
            </p>
            <StatChip label="Evaluator" value="JSONB AST" tone="info" />
            <StatChip label="Propagation" value="mode-aware" tone="violet" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Impact financial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Sales +10% → Revenue" value="+520 triệu" tone="success" />
            <StatChip label="Close -5% → NP" value="-80 triệu" tone="danger" />
            <StatChip label="CPL -10% → CAC" value="-48k" tone="success" />
            <StatChip label="SLA +5% → GP" value="+35 triệu" tone="success" />
            <StatChip label="Payroll +15% → margin" value="-1.2%" tone="warning" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
