"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { Task, Employee, Kpi } from "@/types/domain";
import type { FilterState } from "./TaskFilterBar";
import { applyFilters } from "./TaskFilterBar";
import { isTaskOverdue, todayLocalISO } from "./sprint-utils";
import { updateTaskStatusAction } from "@/app/(app)/workspace/actions";
import {
  Calendar,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  MinusCircle,
  Timer,
} from "lucide-react";

type TaskStatus = Task["status"];

const COLUMNS: Array<{ key: TaskStatus; label: string; color: string; headerColor: string; icon: React.ReactNode }> = [
  {
    key: "todo",
    label: "To do",
    color: "bg-zinc-50 border-zinc-200",
    headerColor: "bg-zinc-100 text-zinc-700",
    icon: <MinusCircle className="h-3.5 w-3.5" />,
  },
  {
    key: "in_progress",
    label: "Đang làm",
    color: "bg-indigo-50/40 border-indigo-200",
    headerColor: "bg-indigo-100 text-indigo-700",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  {
    key: "review",
    label: "Review",
    color: "bg-violet-50/40 border-violet-200",
    headerColor: "bg-violet-100 text-violet-700",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  {
    key: "blocked",
    label: "Blocked",
    color: "bg-red-50/40 border-red-200",
    headerColor: "bg-red-100 text-red-700",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  {
    key: "done",
    label: "Hoàn thành",
    color: "bg-emerald-50/40 border-emerald-200",
    headerColor: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
];

const PRIORITY_BADGE: Record<Task["priority"], string> = {
  urgent: "danger",
  high: "warning",
  normal: "outline",
  low: "outline",
};

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

function daysUntilDue(task: Task): number | null {
  if (!task.due_date) return null;
  const today = todayLocalISO();
  const due = task.due_date.slice(0, 10);
  const diffMs = new Date(due + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

type Props = {
  tasks: Task[];
  employees: Employee[];
  kpis: Kpi[];
  filters: FilterState;
  kpiLinkPct: number;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
};

export function KanbanBoard({
  tasks, employees, kpis, filters, kpiLinkPct,
  selectedIds, onToggleSelect, onOpenDetail,
}: Props) {
  const [localStatus, setLocalStatus] = useState<Record<string, TaskStatus>>({});
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const draggingId = useRef<string | null>(null);

  // Khi server trả tasks mới (sau revalidatePath), bỏ override cục bộ nào đã match
  // — tránh kanban hiển thị lệch với SprintView/list view.
  useEffect(() => {
    setLocalStatus((prev) => {
      const next: Record<string, TaskStatus> = {};
      for (const [id, status] of Object.entries(prev)) {
        const t = tasks.find((x) => x.id === id);
        if (t && t.status !== status) next[id] = status;
      }
      return next;
    });
  }, [tasks]);

  const filteredTasks = applyFilters(tasks, filters);

  const resolvedTasks = filteredTasks.map((t) => ({
    ...t,
    status: localStatus[t.id] ?? t.status,
  }));

  function handleDragStart(e: React.DragEvent, taskId: string) {
    draggingId.current = taskId;
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.4";
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    draggingId.current = null;
    setDragOverCol(null);
  }

  function handleDragOver(e: React.DragEvent, colKey: TaskStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  }

  function handleDrop(e: React.DragEvent, colKey: TaskStatus) {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = draggingId.current;
    if (!taskId) return;

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || (localStatus[taskId] ?? currentTask.status) === colKey) return;

    setLocalStatus((prev) => ({ ...prev, [taskId]: colKey }));

    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("status", colKey);
      await updateTaskStatusAction(fd);
    });
  }

  // ── Task Card component ────────────────────────────────────────────────────
  function TaskCard({ task }: { task: Task }) {
    const assignee = employees.find((e) => e.id === task.assignee_id);
    const kpi = kpis.find((k) => k.id === task.linked_kpi_id);
    const overdue = isTaskOverdue(task);
    const days = daysUntilDue(task);
    const isSelected = selectedIds.includes(task.id);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-checkbox]")) return;
          onOpenDetail(task.id);
        }}
        className={`group relative rounded-lg bg-white border p-2.5 text-xs shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:-translate-y-0.5 ${
          overdue ? "border-red-300" : isSelected ? "border-indigo-400 ring-2 ring-indigo-200" : "border-zinc-200"
        }`}
      >
        {/* Selection checkbox */}
        <div
          data-checkbox
          className={`absolute top-1.5 right-1.5 h-4 w-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
            isSelected
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-zinc-300 bg-white opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
        >
          {isSelected && <CheckCircle2 className="h-2.5 w-2.5" />}
        </div>

        {/* Title */}
        <div
          className={`font-semibold leading-snug mb-1.5 pr-5 ${
            task.status === "done" ? "line-through text-zinc-400" : "text-zinc-900"
          }`}
        >
          {task.title}
        </div>

        {/* Priority + KPI badges */}
        <div className="flex items-center gap-1 flex-wrap mb-1.5">
          {task.priority !== "normal" && (
            <Badge variant={PRIORITY_BADGE[task.priority] as "danger" | "warning" | "outline"}>
              {PRIORITY_LABEL[task.priority]}
            </Badge>
          )}
          {kpi && <Badge variant="info">{kpi.code ?? kpi.name}</Badge>}
          {task.task_type && task.task_type !== "growth" && (
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[9px] font-medium capitalize">
              {task.task_type}
            </span>
          )}
        </div>

        {/* Time tracking mini badge */}
        {(task.estimated_hours || task.actual_hours) && (
          <div className="flex items-center gap-1 mb-1.5 text-zinc-400">
            <Timer className="h-2.5 w-2.5" />
            <span>{task.actual_hours ?? 0}h / {task.estimated_hours ?? "?"}h</span>
          </div>
        )}

        {/* Assignee + due date */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            {assignee ? (
              <>
                <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-semibold">
                  {assignee.full_name.slice(0, 1)}
                </span>
                <span className="truncate max-w-[70px] text-zinc-500">
                  {assignee.full_name}
                </span>
              </>
            ) : (
              <span className="text-zinc-300 italic">Unassigned</span>
            )}
          </div>
          {task.due_date && (
            <span
              className={`flex items-center gap-0.5 tabular-nums ${
                overdue ? "text-red-600 font-semibold" : days !== null && days <= 2 ? "text-amber-600" : "text-zinc-400"
              }`}
            >
              {overdue && <AlertTriangle className="h-2.5 w-2.5" />}
              {task.due_date.slice(5)}
              {overdue && <span className="ml-0.5 text-[9px]">({Math.abs(days!)}d)</span>}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────────────────────
  if (filters.view === "list") {
    return (
      <div className="space-y-1.5">
        {resolvedTasks.length === 0 && (
          <div className="text-center py-12 text-sm text-zinc-400">
            Không tìm thấy task nào phù hợp bộ lọc.
          </div>
        )}
        {resolvedTasks.map((task) => {
          const assignee = employees.find((e) => e.id === task.assignee_id);
          const kpi = kpis.find((k) => k.id === task.linked_kpi_id);
          const overdue = isTaskOverdue(task);
          const days = daysUntilDue(task);
          const col = COLUMNS.find((c) => c.key === task.status);
          const isSelected = selectedIds.includes(task.id);

          return (
            <div
              key={task.id}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-checkbox]")) return;
                onOpenDetail(task.id);
              }}
              className={`group flex items-center gap-3 rounded-xl bg-white border px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md cursor-pointer ${
                overdue ? "border-red-200 bg-red-50/30" : isSelected ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/20" : "border-zinc-200"
              }`}
            >
              {/* Checkbox */}
              <div
                data-checkbox
                className={`shrink-0 h-4.5 w-4.5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-zinc-300 bg-white"
                }`}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
              >
                {isSelected && <CheckCircle2 className="h-2.5 w-2.5" />}
              </div>

              {/* Status badge */}
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${col?.headerColor}`}
              >
                {col?.label}
              </span>

              {/* Title */}
              <span
                className={`flex-1 font-medium truncate ${
                  task.status === "done" ? "line-through text-zinc-400" : "text-zinc-900"
                }`}
              >
                {task.title}
              </span>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {task.priority !== "normal" && (
                  <Badge variant={PRIORITY_BADGE[task.priority] as "danger" | "warning" | "outline"}>
                    {PRIORITY_LABEL[task.priority]}
                  </Badge>
                )}
                {kpi && <Badge variant="info">{kpi.code ?? kpi.name}</Badge>}
              </div>

              {/* Time */}
              {(task.estimated_hours || task.actual_hours) && (
                <span className="shrink-0 flex items-center gap-0.5 text-xs text-zinc-400">
                  <Timer className="h-3 w-3" />
                  {task.actual_hours ?? 0}/{task.estimated_hours ?? "?"}h
                </span>
              )}

              {/* Assignee */}
              {assignee && (
                <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-500">
                  <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-semibold">
                    {assignee.full_name.slice(0, 1)}
                  </span>
                  <span className="hidden sm:block max-w-[100px] truncate">{assignee.full_name}</span>
                </div>
              )}

              {/* Due date */}
              {task.due_date && (
                <div
                  className={`flex items-center gap-1 text-xs shrink-0 ${
                    overdue ? "text-red-600 font-semibold" : days !== null && days <= 2 ? "text-amber-600" : "text-zinc-400"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  {task.due_date.slice(5)}
                  {overdue && <span className="text-[9px]">({Math.abs(days!)}d)</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Kanban View ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500">{resolvedTasks.length} task</span>
        <Badge variant="info">{kpiLinkPct}% task gắn KPI</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const colTasks = resolvedTasks.filter((t) => t.status === col.key);
          const isDragOver = dragOverCol === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`rounded-xl border p-2.5 min-h-[420px] transition-all duration-150 ${col.color} ${
                isDragOver ? "ring-2 ring-indigo-400 ring-offset-1 border-dashed" : ""
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${col.headerColor}`}
                >
                  {col.icon}
                  {col.label}
                </span>
                <span className="text-[10px] text-zinc-500 tabular-nums">{colTasks.length}</span>
              </div>

              {/* Task cards */}
              <div className="space-y-1.5">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {/* Empty column state */}
                {colTasks.length === 0 && (
                  <div
                    className={`flex items-center justify-center h-20 rounded-lg border-2 border-dashed text-xs transition-colors ${
                      isDragOver
                        ? "border-indigo-400 text-indigo-400 bg-indigo-50/50"
                        : "border-zinc-200 text-zinc-300"
                    }`}
                  >
                    {isDragOver ? "Thả vào đây" : "—"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isPending && (
        <div className="mt-2 text-xs text-indigo-500 text-center animate-pulse">Đang cập nhật...</div>
      )}
    </div>
  );
}
