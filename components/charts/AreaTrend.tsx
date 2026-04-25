"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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

export function AreaTrend({
  data,
  dataKey = "value",
  xKey = "label",
  color = "#6366f1",
  height = 180,
  axisFormat = "compact",
}: {
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  axisFormat?: "compact" | "vnd" | "pct" | "number";
}) {
  const formatter = (v: number) =>
    axisFormat === "vnd"
      ? formatCompactVND(v)
      : axisFormat === "pct"
        ? `${v}%`
        : axisFormat === "number"
          ? v.toLocaleString("vi-VN")
          : compactNum(v);

  const tooltipFormatter = (v: number) =>
    axisFormat === "vnd" ? formatCompactVND(v) : compactNum(v);

  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
