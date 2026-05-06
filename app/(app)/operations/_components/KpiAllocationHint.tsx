"use client";

import {
  buildKpiAllocation,
  getSprintMonth,
  shouldApplySprintAllocationRule,
  validateTaskAllocation,
} from "@/lib/kpi/sprintAllocation";
import type { Kpi, KpiTarget, Sprint, Task } from "@/types/domain";
import { AlertTriangle, Target, Info } from "lucide-react";

type Props = {
  kpis: Kpi[];
  sprints: Sprint[];
  tasks: Task[];
  kpiTargets: KpiTarget[];
  linkedKpiId: string | null;
  sprintId: string | null;
  proposedValue: number | null;
  excludeTaskId?: string;
};

function fmt(value: number, unit: string): string {
  const formatted = value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  return `${formatted} ${unit}`.trim();
}

function fmtDateRange(start: string, end: string): string {
  const s = start.slice(8, 10);
  const e = end.slice(8, 10);
  const m = start.slice(5, 7);
  const em = end.slice(5, 7);
  if (m === em) return `${s}-${e}/${m}`;
  return `${s}/${m}–${e}/${em}`;
}

export function KpiAllocationHint({
  kpis,
  sprints,
  tasks,
  kpiTargets,
  linkedKpiId,
  sprintId,
  proposedValue,
  excludeTaskId,
}: Props) {
  if (!linkedKpiId) return null;

  const kpi = kpis.find((row) => row.id === linkedKpiId);
  if (!kpi) return null;
  if (!shouldApplySprintAllocationRule(kpi)) return null;

  if (!sprintId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Task gắn KPI tháng <b>{kpi.code ?? kpi.name}</b> nhưng chưa được gán Sprint — cần gán sprint để chia
          target tháng cho từng đợt 2 tuần.
        </span>
      </div>
    );
  }

  const targetSprint = sprints.find((row) => row.id === sprintId);
  if (!targetSprint) return null;

  const month = getSprintMonth(targetSprint);
  const monthSprints = sprints
    .filter((row) => getSprintMonth(row) === month)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const target = kpiTargets.find((row) => row.kpi_id === linkedKpiId && row.period === month);
  if (!target) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          KPI <b>{kpi.code ?? kpi.name}</b> chưa set target cho tháng <b>{month}</b> — không thể kiểm tra phân
          bổ sprint. Set target tháng trước đã.
        </span>
      </div>
    );
  }

  const allocation = buildKpiAllocation({
    kpi,
    monthlyTarget: target.target_value,
    monthSprints,
    tasksInScope: tasks,
    excludeTaskId,
  });

  const proposed = proposedValue ?? 0;
  const validation =
    proposed > 0
      ? validateTaskAllocation({
          allocation,
          targetSprintId: sprintId,
          proposedValue: proposed,
        })
      : { ok: true as const };

  const projectedTotal = allocation.totalAllocated + proposed;
  const projectedGap = allocation.monthlyTarget - projectedTotal;
  const gapPct = allocation.monthlyTarget > 0 ? (projectedTotal / allocation.monthlyTarget) * 100 : 0;
  const onlyOneSprint = allocation.sprints.length <= 1;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800">
        <Target className="h-3.5 w-3.5" />
        KPI tháng — {kpi.code ?? kpi.name} — {month}
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-200">
          Target: {fmt(allocation.monthlyTarget, allocation.unit)}
        </span>
      </div>

      {onlyOneSprint && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Tháng này chỉ có 1 sprint → split = full target.
        </div>
      )}

      <div className="space-y-1.5">
        {allocation.sprints.map((row) => {
          const isCurrent = row.sprint.id === sprintId;
          const projectedAllocated = isCurrent ? row.allocatedValue + proposed : row.allocatedValue;
          const pct = row.splitTarget > 0 ? Math.min(100, (projectedAllocated / row.splitTarget) * 100) : 0;
          const overflow = projectedAllocated > row.splitTarget;
          return (
            <div
              key={row.sprint.id}
              className={`rounded-lg border p-2 text-xs ${
                isCurrent ? "border-indigo-300 bg-white" : "border-zinc-200 bg-white/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-zinc-800 truncate">
                  {isCurrent ? "▶ " : ""}
                  {row.sprint.name}{" "}
                  <span className="text-zinc-400 font-normal">({fmtDateRange(row.sprint.start_date, row.sprint.end_date)})</span>
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    overflow ? "text-red-600" : pct >= 100 ? "text-emerald-600" : "text-zinc-500"
                  }`}
                >
                  {fmt(projectedAllocated, "")}/{fmt(row.splitTarget, allocation.unit)} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    overflow ? "bg-red-500" : pct >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {row.taskCount > 0 && (
                <div className="mt-1 text-[10px] text-zinc-500">
                  {row.taskCount} task hiện đang chia phần
                </div>
              )}
              {isCurrent && row.taskCount === 0 && (
                <div className="mt-1 text-[10px] text-zinc-400">🔴 Chưa có task khác trong sprint này</div>
              )}
            </div>
          );
        })}
      </div>

      {!validation.ok && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold mb-0.5">Vượt quá phần cho sprint này</div>
            <div>{validation.reason}</div>
          </div>
        </div>
      )}

      {validation.ok && projectedGap > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div>
            Sau khi tạo task này, đang phân bổ{" "}
            <b>
              {fmt(projectedTotal, allocation.unit)}/{fmt(allocation.monthlyTarget, allocation.unit)}
            </b>{" "}
            ({gapPct.toFixed(0)}%). Còn thiếu <b>{fmt(projectedGap, allocation.unit)}</b> — cần thêm task ở
            sprint kia để đủ KPI tháng.
          </div>
        </div>
      )}

      {validation.ok && projectedGap <= 0 && projectedTotal > allocation.monthlyTarget && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800">
          ✓ Đã phân bổ đủ KPI tháng (vượt {fmt(projectedTotal - allocation.monthlyTarget, allocation.unit)} so
          với target).
        </div>
      )}

      {validation.ok && projectedGap === 0 && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800">
          ✓ Phân bổ vừa đủ KPI tháng.
        </div>
      )}
    </div>
  );
}
