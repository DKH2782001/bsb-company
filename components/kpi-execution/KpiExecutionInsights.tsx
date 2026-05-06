import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiExecutionInsight } from "@/lib/kpi/execution";

export function KpiExecutionInsights({ insights }: { insights: KpiExecutionInsight[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-2xl border px-4 py-3 text-sm ${
              insight.tone === "red"
                ? "border-red-200 bg-red-50 text-red-900"
                : insight.tone === "yellow"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : insight.tone === "green"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-indigo-200 bg-indigo-50 text-indigo-900"
            }`}
          >
            {insight.text}
          </div>
        ))}
        {insights.length === 0 && <div className="text-sm text-zinc-500">Chưa có insight tự động.</div>}
      </CardContent>
    </Card>
  );
}
