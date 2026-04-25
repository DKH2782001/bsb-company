"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function KpiHeroDonut({
  value,
  label = "Completion",
  segments,
  height = 220,
  accent = "#6366f1",
}: {
  /** 0..1 or 0..100 — tự detect */
  value: number;
  label?: string;
  /** Optional breakdown in center ring. Tổng cộng = 100. */
  segments?: Array<{ name: string; value: number; color: string }>;
  height?: number;
  accent?: string;
}) {
  const pct = value > 1.5 ? value : value * 100;
  const data =
    segments ?? [
      { name: "done", value: pct, color: accent },
      { name: "rest", value: 100 - pct, color: "#eef2f7" },
    ];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={Math.round(height * 0.32)}
            outerRadius={Math.round(height * 0.46)}
            paddingAngle={1}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-zinc-900">{Math.round(pct)}%</div>
        <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
