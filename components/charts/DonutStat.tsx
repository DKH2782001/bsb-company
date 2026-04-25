"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function DonutStat({
  data,
  centerLabel,
  centerValue,
  height = 220,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  centerLabel?: string;
  centerValue?: string;
  height?: number;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-zinc-900">{centerValue}</div>
          {centerLabel && <div className="text-xs text-zinc-500">{centerLabel}</div>}
        </div>
      )}
    </div>
  );
}
