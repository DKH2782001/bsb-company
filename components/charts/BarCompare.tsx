"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactVND } from "@/lib/utils";

function compactNum(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return `${v}`;
}

export function BarCompare({
  data,
  bars,
  xKey = "label",
  height = 220,
  axisFormat = "number",
  stacked = false,
}: {
  data: Array<Record<string, string | number>>;
  bars: Array<{ key: string; name: string; color: string }>;
  xKey?: string;
  height?: number;
  axisFormat?: "compact" | "vnd" | "pct" | "number";
  stacked?: boolean;
}) {
  const formatter = (v: number) =>
    axisFormat === "vnd"
      ? formatCompactVND(v)
      : axisFormat === "pct"
        ? `${v}%`
        : axisFormat === "compact"
          ? compactNum(v)
          : v.toLocaleString("vi-VN");

  const tooltipFormatter = (v: number) =>
    axisFormat === "vnd" ? formatCompactVND(v) : axisFormat === "pct" ? `${v}%` : compactNum(v);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis dataKey={xKey} stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#a1a1aa"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={formatter}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e4e4e7",
            fontSize: 12,
          }}
          formatter={(v) => tooltipFormatter(Number(v))}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {bars.map((b) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name}
            fill={b.color}
            radius={stacked ? 0 : [4, 4, 0, 0]}
            stackId={stacked ? "s" : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
