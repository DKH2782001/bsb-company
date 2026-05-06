"use client";

import { useState, useCallback } from "react";
import { TaskFilterBar, type FilterState, EMPTY_FILTERS } from "./TaskFilterBar";
import { KanbanBoard } from "./KanbanBoard";
import { TaskDetailModal } from "./TaskDetailModal";
import SprintView from "./SprintView";
import type {
  Task,
  Sprint,
  Employee,
  Kpi,
  KpiTarget,
  Department,
  TaskResult,
  DepartmentResultKpi,
  ActionPlan,
  ActionMetric,
} from "@/types/domain";

type Props = {
  tasks: Task[];
  sprints: Sprint[];
  employees: Employee[];
  kpis: Kpi[];
  kpiTargets?: KpiTarget[];
  resultKpis: DepartmentResultKpi[];
  actionPlans: ActionPlan[];
  actionMetrics: ActionMetric[];
  departments: Department[];
  taskResults?: TaskResult[];
  kpiLinkPct: number;
};

export function OperationsBoard({
  tasks,
  sprints,
  employees,
  kpis,
  kpiTargets = [],
  resultKpis,
  actionPlans,
  actionMetrics,
  departments,
  taskResults = [],
  kpiLinkPct,
}: Props) {
  const [activeTab, setActiveTab] = useState<"tasks" | "sprints">("tasks");

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  // Selected task for detail modal
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const detailTask = detailTaskId ? tasks.find((t) => t.id === detailTaskId) : null;

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return (
    <>
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-4">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tasks" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          📋 Task Board
        </button>
        <button
          onClick={() => setActiveTab("sprints")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "sprints" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          🏃 Sprints
          {sprints.some((s) => s.status === "active") && (
            <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          )}
        </button>
      </div>

      {activeTab === "tasks" ? (
        <>
          <TaskFilterBar
            employees={employees}
            departments={departments}
            filters={filters}
            onChange={setFilters}
            selectedIds={selectedIds}
            onClearSelection={handleClearSelection}
          />
          <KanbanBoard
            tasks={tasks}
            employees={employees}
            kpis={kpis}
            resultKpis={resultKpis}
            actionPlans={actionPlans}
            actionMetrics={actionMetrics}
            filters={filters}
            kpiLinkPct={kpiLinkPct}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onOpenDetail={(id) => setDetailTaskId(id)}
          />
        </>
      ) : (
        <SprintView
          tasks={tasks}
          sprints={sprints}
          employees={employees}
          kpis={kpis}
          kpiTargets={kpiTargets}
          onOpenDetail={(id) => setDetailTaskId(id)}
        />
      )}

      {/* Task Detail Modal — dùng chung cho cả Task Board và Sprint View */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          employees={employees}
          kpis={kpis}
          kpiTargets={kpiTargets}
          sprints={sprints}
          tasks={tasks}
          resultKpis={resultKpis}
          actionPlans={actionPlans}
          actionMetrics={actionMetrics}
          departments={departments}
          results={taskResults.filter((r) => r.task_id === detailTask.id)}
          onClose={() => setDetailTaskId(null)}
        />
      )}
    </>
  );
}
