import type { Kpi, Sprint, Task } from "@/types/domain";

export type SprintAllocation = {
  sprint: Sprint;
  allocatedValue: number;
  splitTarget: number;
  remaining: number;
  taskCount: number;
};

export type KpiMonthlyAllocation = {
  kpi: Kpi;
  monthlyTarget: number;
  month: string;
  unit: string;
  sprints: SprintAllocation[];
  totalAllocated: number;
  gap: number;
};

export function shouldApplySprintAllocationRule(kpi: Kpi | null | undefined): boolean {
  return kpi?.target_frequency === "monthly";
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isoMonth(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isIntegerUnit(unit: string) {
  const normalized = unit.trim().toLowerCase();
  if (!normalized) return false;
  return !["%", "percent", "percentage", "ratio", "rate", "score", "point", "points"].includes(normalized);
}

function roundSplitTarget(value: number, unit: string) {
  if (!Number.isFinite(value)) return 0;
  if (isIntegerUnit(unit)) return Math.ceil(value);
  return Math.round(value * 100) / 100;
}

export function getSprintMonth(sprint: Sprint): string {
  const start = parseDateOnly(sprint.start_date);
  const end = parseDateOnly(sprint.end_date);
  const counts = new Map<string, number>();

  for (let day = start; day.getTime() <= end.getTime(); day = addDays(day, 1)) {
    const month = isoMonth(day);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  const endMonth = isoMonth(end);
  const qualified = Array.from(counts.entries())
    .filter(([, count]) => count >= 8)
    .sort((left, right) => right[1] - left[1]);

  if (qualified.length === 0) return endMonth;
  if (qualified.length >= 2 && qualified[0][1] === qualified[1][1]) return endMonth;
  return qualified[0][0];
}

export function buildKpiAllocation(args: {
  kpi: Kpi;
  monthlyTarget: number;
  monthSprints: Sprint[];
  tasksInScope: Task[];
  excludeTaskId?: string;
}): KpiMonthlyAllocation {
  const monthSprints = args.monthSprints;
  const sprintCount = Math.max(1, monthSprints.length);
  const splitTarget = roundSplitTarget(args.monthlyTarget / sprintCount, args.kpi.unit);
  const sprintIds = new Set(monthSprints.map((sprint) => sprint.id));
  const scopedTasks = args.tasksInScope.filter(
    (task) =>
      task.linked_kpi_id === args.kpi.id &&
      task.sprint_id &&
      sprintIds.has(task.sprint_id) &&
      task.id !== args.excludeTaskId,
  );

  const sprints = monthSprints.map((sprint) => {
    const sprintTasks = scopedTasks.filter((task) => task.sprint_id === sprint.id);
    const allocatedValue = sprintTasks.reduce((sum, task) => sum + (task.action_target_value ?? 0), 0);
    return {
      sprint,
      allocatedValue,
      splitTarget,
      remaining: Math.max(0, splitTarget - allocatedValue),
      taskCount: sprintTasks.length,
    };
  });

  const totalAllocated = sprints.reduce((sum, sprint) => sum + sprint.allocatedValue, 0);
  return {
    kpi: args.kpi,
    monthlyTarget: args.monthlyTarget,
    month: monthSprints[0] ? getSprintMonth(monthSprints[0]) : "",
    unit: args.kpi.unit,
    sprints,
    totalAllocated,
    gap: args.monthlyTarget - totalAllocated,
  };
}

export function validateTaskAllocation(args: {
  allocation: KpiMonthlyAllocation;
  targetSprintId: string;
  proposedValue: number;
}): { ok: true } | { ok: false; reason: string; remaining: number } {
  const sprint = args.allocation.sprints.find((item) => item.sprint.id === args.targetSprintId);
  if (!sprint) return { ok: true };
  if (args.proposedValue <= sprint.remaining) return { ok: true };

  const over = args.proposedValue - sprint.remaining;
  return {
    ok: false,
    remaining: sprint.remaining,
    reason: `Sprint này chỉ còn lại ${formatNumber(sprint.remaining)} ${args.allocation.unit} cho KPI '${args.allocation.kpi.name}'. Tổng tháng đã chia đều cho ${args.allocation.sprints.length} sprint = ${formatNumber(sprint.splitTarget)} ${args.allocation.unit}/sprint. Vượt ${formatNumber(over)} ${args.allocation.unit}.`,
  };
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}
