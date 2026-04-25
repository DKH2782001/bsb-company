import type { Task, Sprint } from "@/types/domain";

/** Calculate sprint health based on time elapsed vs completion */
export function getSprintHealth(sprint: Sprint, tasks: Task[]) {
  const now = new Date();
  const start = new Date(sprint.start_date);
  const end = new Date(sprint.end_date);
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const timePercentage = Math.min(100, (daysElapsed / totalDays) * 100);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const completionPct = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  let status: "ahead" | "on_track" | "behind" | "at_risk";
  let color: string;
  let label: string;

  if (completionPct > timePercentage + 10) {
    status = "ahead";
    color = "text-emerald-600";
    label = "🎯 Đang tốt";
  } else if (completionPct >= timePercentage - 20) {
    status = "on_track";
    color = "text-blue-600";
    label = "👍 Đúng tiến độ";
  } else if (completionPct >= timePercentage - 40) {
    status = "behind";
    color = "text-amber-600";
    label = "⚠️ Chậm tiến độ";
  } else {
    status = "at_risk";
    color = "text-red-600";
    label = "🔴 Nguy hiểm";
  }

  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    status,
    color,
    label,
    timePercentage,
    completionPct,
    daysLeft,
    daysElapsed: Math.ceil(daysElapsed),
    totalDays: Math.ceil(totalDays),
  };
}

/** Calculate sprint metrics (same logic as AI Task Tracker) */
export function calculateSprintMetrics(sprint: Sprint, tasks: Task[]) {
  const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id);

  const plannedPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const completedTasks = sprintTasks.filter((t) => t.status === "done");
  const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const carryOverTasks = sprintTasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled"
  );
  const carryOverPoints = carryOverTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);

  return {
    plannedPoints,
    completedPoints,
    carryOverPoints,
    velocity: completedPoints,
    completionRate: plannedPoints > 0 ? Number(((completedPoints / plannedPoints) * 100).toFixed(1)) : 0,
    taskCount: {
      planned: sprintTasks.length,
      completed: completedTasks.length,
      carriedOver: carryOverTasks.length,
      cancelled: sprintTasks.filter((t) => t.status === "cancelled").length,
    },
  };
}

/** Get tasks by status for a sprint */
export function getSprintTasksByStatus(tasks: Task[], sprintId: string) {
  const sprintTasks = tasks.filter((t) => t.sprint_id === sprintId);
  return {
    todo: sprintTasks.filter((t) => t.status === "todo"),
    in_progress: sprintTasks.filter((t) => t.status === "in_progress"),
    review: sprintTasks.filter((t) => t.status === "review"),
    blocked: sprintTasks.filter((t) => t.status === "blocked"),
    done: sprintTasks.filter((t) => t.status === "done"),
    all: sprintTasks,
  };
}

/** Get backlog tasks (not assigned to any active/planning sprint) */
export function getBacklogTasks(tasks: Task[]) {
  return tasks.filter((t) => !t.sprint_id && t.status !== "done" && t.status !== "cancelled");
}

/** Fibonacci sequence for story points */
export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

/** Format days left text */
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft > 0) return `Còn ${daysLeft} ngày`;
  if (daysLeft === 0) return "Hôm nay là ngày cuối";
  return `Quá hạn ${Math.abs(daysLeft)} ngày`;
}
