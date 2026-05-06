import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiExecutionAlignment as KpiExecutionAlignmentData } from "@/lib/kpi/execution";
import { formatExecutionPercent } from "./shared";

export function KpiExecutionAlignment({ alignment }: { alignment: KpiExecutionAlignmentData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">KPI vs Execution Alignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="KPI Result Completion" value={formatExecutionPercent(alignment.kpi_completion)} />
          <Metric label="Action Plan Completion" value={formatExecutionPercent(alignment.action_plan_completion)} />
          <Metric label="Task Completion" value={formatExecutionPercent(alignment.task_completion)} />
          <Metric label="Average SLA" value={`${Math.round(alignment.avg_sla)}%`} />
          <Metric label="Average Quality" value={`${Math.round(alignment.avg_quality)}%`} />
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          {alignment.insight}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-zinc-900">{value}</div>
    </div>
  );
}
