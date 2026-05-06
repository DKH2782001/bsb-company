import type { EnrichedActionMetric } from "@/lib/kpi/execution";
import { formatExecutionPercent, formatExecutionValue, RiskBadge } from "./shared";

export function ActionMetricCards({ metrics }: { metrics: EnrichedActionMetric[] }) {
  if (metrics.length === 0) {
    return <div className="text-sm text-zinc-500">Chưa có action metric cho action plan này.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
        Action metrics measure execution effort, not final KPI result.
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900">{metric.name}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {metric.assignee_name ?? metric.owner_name ?? "Chưa giao"} · {metric.unit}
                </div>
              </div>
              <RiskBadge risk={metric.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <Mini label="Target" value={`${formatExecutionValue(metric.target, metric.unit)} ${metric.unit}`} />
              <Mini label="Actual" value={`${formatExecutionValue(metric.actual, metric.unit)} ${metric.unit}`} />
              <Mini label="Completion" value={formatExecutionPercent(metric.completion)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 font-medium text-zinc-900">{value}</div>
    </div>
  );
}
