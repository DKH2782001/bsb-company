import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock3, Database, Target } from "lucide-react";
import type { KpiExecutionPanel } from "@/lib/kpi/execution";
import { formatExecutionPercent, formatExecutionValue, ResultStatus } from "./shared";

export function DepartmentKpiSummary({
  panel,
  onOpenDetail,
  showDetailButton = true,
}: {
  panel: KpiExecutionPanel;
  onOpenDetail: () => void;
  showDetailButton?: boolean;
}) {
  const summary = panel.summary;

  return (
    <Card className="border-zinc-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Selected KPI Summary
            </div>
            <CardTitle className="mt-1 text-2xl">{summary.name}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <Badge variant="outline">{summary.department_name}</Badge>
              <Badge variant="outline">{summary.period}</Badge>
              <Badge variant="outline">{summary.type}</Badge>
              <Badge variant="outline">{summary.level}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ResultStatus status={summary.status} completion={summary.completion} />
            {showDetailButton && (
              <Button variant="outline" size="sm" onClick={onOpenDetail}>
                Xem chi tiết
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Stat label="Target" value={formatExecutionValue(summary.target, summary.unit)} hint={summary.unit} />
          <Stat label="Actual" value={formatExecutionValue(summary.actual, summary.unit)} hint={summary.unit} />
          <Stat
            label="Completion"
            value={formatExecutionPercent(summary.completion)}
            hint={summary.is_result_kpi ? "Result KPI only" : "KPI actual vs target"}
          />
          <Stat label="Remaining" value={formatExecutionValue(summary.remaining, summary.unit)} hint="Need to close" />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <Target className="h-4 w-4 text-indigo-600" />
              Required Pace
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Metric label="Days left" value={String(summary.days_left)} />
              <Metric
                label="Required / day"
                value={`${Math.ceil(summary.required_per_day).toLocaleString("vi-VN")} ${summary.unit}/ngày`}
              />
              <Metric label="Last updated" value={new Date(summary.last_updated_at).toLocaleDateString("vi-VN")} />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <Database className="h-4 w-4 text-indigo-600" />
              Source
            </div>
            <div className="space-y-2 text-sm">
              <Metric label="Data source" value={summary.data_source} />
              <Metric label="Rollup mode" value={summary.rollup_mode} />
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Task completion và action metrics chỉ đo execution effort, không cộng trực tiếp vào actual KPI kết quả.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock3 className="h-3.5 w-3.5" />
          Actual KPI chỉ lấy từ data source của KPI hoặc nhập tay/import, không lấy từ task hay action metric.
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{hint}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 font-medium text-zinc-900">{value}</div>
    </div>
  );
}
