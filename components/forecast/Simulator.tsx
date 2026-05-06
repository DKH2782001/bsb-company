"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { simulateImpact, type KpiRow } from "@/lib/kpi/cascade";
import { formatCompactVND, formatPercent } from "@/lib/utils";
import type { KpiFormula } from "@/types/domain";

export function Simulator({ rows, formulas }: { rows: KpiRow[]; formulas: KpiFormula[] }) {
  const leaves = rows.filter((row) => row.level === "employee" || row.level === "department");
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  const impact = useMemo(() => simulateImpact(rows, deltas, formulas), [rows, deltas, formulas]);
  const companyKpis = rows.filter((row) => row.level === "company");

  const formatByUnit = (value: number, unit: string) => {
    if (unit === "VND") return formatCompactVND(value);
    if (unit === "%") return formatPercent(value, 1);
    return value.toLocaleString("vi-VN");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>What-if: thay đổi các KPI đầu vào</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[600px] space-y-4 overflow-y-auto">
          {leaves.map((leaf) => {
            const value = deltas[leaf.id] ?? 0;
            return (
              <div key={leaf.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    <span className="font-medium">{leaf.name}</span>{" "}
                    <span className="font-mono text-zinc-400">({leaf.code})</span>
                  </Label>
                  <Badge variant={value === 0 ? "outline" : value > 0 ? "success" : "danger"}>
                    {value > 0 ? "+" : ""}
                    {value}%
                  </Badge>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={value}
                  onChange={(event) =>
                    setDeltas((prev) => ({ ...prev, [leaf.id]: Number(event.target.value) }))
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact lên KPI công ty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {companyKpis.map((kpi) => {
            const currentImpact = impact[kpi.id];
            if (!currentImpact) return null;
            const positive = currentImpact.delta_pct >= 0;
            return (
              <div key={kpi.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="mb-1 text-xs text-zinc-500">{kpi.name}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-zinc-900">
                      {formatByUnit(currentImpact.after, kpi.unit)}
                    </div>
                    <div className="text-xs text-zinc-400 line-through">
                      {formatByUnit(currentImpact.before, kpi.unit)}
                    </div>
                  </div>
                  <Badge variant={positive ? "success" : "danger"}>
                    {positive ? "+" : ""}
                    {currentImpact.delta_pct.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            );
          })}

          <div className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">
            Simulator dùng `lib/kpi/cascade.simulateImpact` — KPI cha `sum` sẽ cộng actual con tương thích,
            KPI `ratio`/`formula` sẽ đi theo công thức thay vì weighted average mù.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
