import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiManager } from "@/components/kpi/KpiManager";
import { KpiExecutionView } from "@/components/kpi-execution/KpiExecutionView";
import {
  fetchDepartments,
  fetchEmployees,
} from "@/lib/queries";
import { recordKpiActualAction } from "@/app/(app)/workspace/actions";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { buildKpiExecutionPanels } from "@/lib/kpi/execution";
import { formatCompactVND } from "@/lib/utils";
import { Building2, Target } from "lucide-react";
import {
  executionDemoActionMetrics,
  executionDemoActionPlans,
  executionDemoDepartmentResultKpis,
  executionDemoEmployeeExecutions,
  executionDemoKpiActuals,
  executionDemoKpiFormulas,
  executionDemoKpis,
  executionDemoKpiTargets,
  executionDemoTasks,
} from "@/lib/queries/kpiExecutionDemo";

export default async function KpiPage() {
  const { t } = await tServer();
  const [employees, departments] = await Promise.all([fetchEmployees(), fetchDepartments()]);

  const kpis = executionDemoKpis;
  const targets = executionDemoKpiTargets;
  const actuals = executionDemoKpiActuals;
  const formulas = executionDemoKpiFormulas;
  const tasks = executionDemoTasks;
  const departmentResultKpis = executionDemoDepartmentResultKpis;
  const actionPlans = executionDemoActionPlans;
  const actionMetrics = executionDemoActionMetrics;
  const employeeExecutions = executionDemoEmployeeExecutions;

  const rows = buildKpiRows(kpis, targets, actuals, formulas);
  const panels = buildKpiExecutionPanels({
    rows,
    departmentKpis: departmentResultKpis,
    actionPlans,
    actionMetrics,
    employeeExecution: employeeExecutions,
    tasks,
    employees,
    departments,
  });

  const companyRows = rows.filter((row) => row.level === "company").slice(0, 4);
  const tableRows = kpis.map((kpi) => {
    const row = rows.find((item) => item.id === kpi.id);
    return {
      ...kpi,
      calcMode: row?.calcMode ?? "manual",
      metricGroup: row?.metricGroup ?? ("other" as const),
      status: row?.status ?? ("na" as const),
      completion: row?.completion ?? null,
      target: row?.target ?? null,
      actual: row?.actual ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        helpKey="/kpi"
        title="KPI Execution View"
        description="KPI Tree -> chọn KPI -> quản trị execution theo Action Plan, Action Metric và Task"
        actions={<Badge variant="info">{t("topbar.period")}</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {companyRows.map((row) => (
          <KpiCard
            key={row.id}
            label={row.name}
            value={row.actual != null && row.unit === "VND" ? formatCompactVND(row.actual) : `${Math.round((row.completion ?? 0) * 100)}%`}
            hint={`${row.code ?? row.unit} · target ${row.target?.toLocaleString("vi-VN") ?? "—"}`}
            accent={
              row.status === "green"
                ? "emerald"
                : row.status === "yellow"
                  ? "amber"
                  : row.status === "red"
                    ? "red"
                    : "indigo"
            }
            icon={row.code === "REV" ? <Building2 className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
            spark={[72, 78, 81, 84, 88, Math.round((row.completion ?? 0) * 100)]}
          />
        ))}
      </div>

      <div className="mb-6 space-y-4">
        <KpiExecutionView rows={rows} panels={panels} />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Record KPI Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={recordKpiActualAction} className="grid gap-3 md:grid-cols-4">
              <select
                name="kpiId"
                className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]"
              >
                <option value="">Chọn KPI</option>
                {kpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>
                    {kpi.code ?? kpi.name}
                  </option>
                ))}
              </select>
              <Input name="period" defaultValue="2026-04" />
              <Input name="actualValue" type="number" placeholder="Actual value" required />
              <Button type="submit">Lưu actual</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Danh sách toàn bộ KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <KpiManager rows={tableRows} kpis={kpis} departments={departments} employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
