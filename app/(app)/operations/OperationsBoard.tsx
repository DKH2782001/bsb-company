"use client";

import { useState, useCallback } from "react";
import { TaskFilterBar, type FilterState } from "./TaskFilterBar";
import { KanbanBoard } from "./KanbanBoard";
import { TaskDetailModal } from "./TaskDetailModal";
import SprintView from "./SprintView";
import type { Task, Sprint, Employee, Kpi, Department } from "@/types/domain";

type Props = {
  tasks: Task[];
  sprints: Sprint[];
  employees: Employee[];
  kpis: Kpi[];
  departments: Department[];
  kpiLinkPct: number;
};

export function OperationsBoard({ tasks, sprints, employees, kpis, departments, kpiLinkPct }: Props) {
  const [activeTab, setActiveTab] = useState<"tasks" | "sprints">("tasks");

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    priority: "",
    taskType: "",
    assigneeId: "",
    overdueOnly: false,
    view: "kanban",
  });

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
            filters={filters}
            onChange={setFilters}
            selectedIds={selectedIds}
            onClearSelection={handleClearSelection}
          />
          <KanbanBoard
            tasks={tasks}
            employees={employees}
            kpis={kpis}
            filters={filters}
            kpiLinkPct={kpiLinkPct}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onOpenDetail={(id) => setDetailTaskId(id)}
          />

          {/* Task Detail Modal */}
          {detailTask && (
            <TaskDetailModal
              task={detailTask}
              employees={employees}
              kpis={kpis}
              departments={departments}
              onClose={() => setDetailTaskId(null)}
            />
          )}
        </>
      ) : (
        <SprintView
          tasks={tasks}
          sprints={sprints}
          employees={employees}
        />
      )}
    </>
  );
}
