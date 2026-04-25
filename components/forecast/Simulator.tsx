"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { simulateImpact, type KpiRow } from "@/lib/kpi/cascade";
import { formatCompactVND, formatPercent } from "@/lib/utils";

export function Simulator({ rows }: { rows: KpiRow[] }) {
  const leaves = rows.filter((r) => r.level === "employee" || r.level === "department");
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  const impact = useMemo(() => simulateImpact(rows, deltas), [rows, deltas]);

  const companyKpis = rows.filter((r) => r.level === "company");

  const formatByUnit = (val: number, unit: string) => {
    if (unit === "VND") return formatCompactVND(val);
    if (unit === "%") return formatPercent(val, 1);
    return val.toLocaleString("vi-VN");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>What-if: thay đổi các KPI đầu vào</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {leaves.map((l) => {
            const v = deltas[l.id] ?? 0;
            return (
              <div key={l.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    <span className="font-medium">{l.name}</span>{" "}
                    <span className="text-zinc-400 font-mono">({l.code})</span>
                  </Label>
                  <Badge variant={v === 0 ? "outline" : v > 0 ? "success" : "danger"}>
                    {v > 0 ? "+" : ""}
                    {v}%
                  </Badge>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={v}
                  onChange={(e) =>
                    setDeltas((prev) => ({ ...prev, [l.id]: Number(e.target.value) }))
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
          {companyKpis.map((k) => {
            const i = impact[k.id];
            if (!i) return null;
            const positive = i.delta_pct >= 0;
            return (
              <div key={k.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="text-xs text-zinc-500 mb-1">{k.name}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-zinc-900">
                      {formatByUnit(i.after, k.unit)}
                    </div>
                    <div className="text-xs text-zinc-400 line-through">
                      {formatByUnit(i.before, k.unit)}
                    </div>
                  </div>
                  <Badge variant={positive ? "success" : "danger"}>
                    {positive ? "+" : ""}
                    {i.delta_pct.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            );
          })}

          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500 mt-3">
            Simulator dùng `lib/kpi/cascade.simulateImpact` — áp delta vào KPI lá rồi propagate lên
            cha theo weighted average.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
