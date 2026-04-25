"use client";

import { useState, useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, LayoutGrid, List, X, AlertTriangle, CheckSquare, Trash2 } from "lucide-react";
import type { Task, Employee } from "@/types/domain";
import { bulkUpdateTasksAction } from "@/app/(app)/workspace/actions";

export type FilterState = {
  search: string;
  status: string;
  priority: string;
  taskType: string;
  assigneeId: string;
  overdueOnly: boolean;
  view: "kanban" | "list";
};

const STATUSES = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "Đang làm" },
  { value: "review", label: "Review" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Hoàn thành" },
];

const PRIORITIES = [
  { value: "", label: "Tất cả ưu tiên" },
  { value: "urgent", label: "🔴 Urgent" },
  { value: "high", label: "🟠 High" },
  { value: "normal", label: "🟡 Normal" },
  { value: "low", label: "🟢 Low" },
];

const TASK_TYPES = [
  { value: "", label: "Tất cả loại" },
  { value: "growth", label: "Growth" },
  { value: "maintenance", label: "Maintenance" },
  { value: "admin", label: "Admin" },
  { value: "urgent", label: "Urgent" },
];

type Props = {
  employees: Employee[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  selectedIds: string[];
  onClearSelection: () => void;
};

export function TaskFilterBar({ employees, filters, onChange, selectedIds, onClearSelection }: Props) {
  const set = useCallback(
    (patch: Partial<FilterState>) => onChange({ ...filters, ...patch }),
    [filters, onChange],
  );

  const [isPending, startTransition] = useTransition();

  const hasActiveFilters =
    filters.search || filters.status || filters.priority || filters.taskType || filters.assigneeId || filters.overdueOnly;

  const selectClass =
    "h-9 rounded-lg border border-[var(--line-soft)] bg-white px-3 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-indigo-400";

  function handleBulkStatus(status: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskIds", selectedIds.join(","));
      fd.set("status", status);
      await bulkUpdateTasksAction(fd);
      onClearSelection();
    });
  }

  // ── Bulk actions bar ────────────────────────────────────────────────────────
  if (selectedIds.length > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2 mr-3">
          <CheckSquare className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">
            {selectedIds.length} task đã chọn
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("done")} disabled={isPending}
            className="h-7 text-[11px] bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100">
            ✅ Done
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("in_progress")} disabled={isPending}
            className="h-7 text-[11px] bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100">
            ⚡ In Progress
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("todo")} disabled={isPending}
            className="h-7 text-[11px] bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100">
            📋 To Do
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("blocked")} disabled={isPending}
            className="h-7 text-[11px] bg-red-50 border-red-300 text-red-700 hover:bg-red-100">
            🚫 Blocked
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("cancelled")} disabled={isPending}
            className="h-7 text-[11px] bg-zinc-50 border-zinc-300 text-zinc-500 hover:bg-zinc-100">
            ❌ Cancel
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={onClearSelection}
          className="ml-auto h-7 text-[11px] text-zinc-500 hover:text-zinc-700">
          <X className="h-3 w-3 mr-0.5" /> Bỏ chọn
        </Button>

        {isPending && (
          <span className="text-xs text-indigo-500 animate-pulse">Đang cập nhật...</span>
        )}
      </div>
    );
  }

  // ── Normal filter bar ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-[var(--line-soft)] shadow-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-[260px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <Input
          placeholder="Tìm task..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => set({ status: e.target.value })}
        className={selectClass}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => set({ priority: e.target.value })}
        className={selectClass}
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Task type filter */}
      <select
        value={filters.taskType}
        onChange={(e) => set({ taskType: e.target.value })}
        className={selectClass}
      >
        {TASK_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Assignee filter */}
      <select
        value={filters.assigneeId}
        onChange={(e) => set({ assigneeId: e.target.value })}
        className={selectClass}
      >
        <option value="">Tất cả assignee</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.full_name}
          </option>
        ))}
      </select>

      {/* Overdue toggle */}
      <button
        onClick={() => set({ overdueOnly: !filters.overdueOnly })}
        className={`flex items-center gap-1 h-9 px-3 rounded-lg border text-xs font-medium transition-all ${
          filters.overdueOnly
            ? "bg-red-50 border-red-300 text-red-700"
            : "border-[var(--line-soft)] bg-white text-zinc-500 hover:text-red-600 hover:border-red-200"
        }`}
      >
        <AlertTriangle className="h-3 w-3" />
        Quá hạn
      </button>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ search: "", status: "", priority: "", taskType: "", assigneeId: "", overdueOnly: false, view: filters.view })
          }
          className="h-9 text-xs text-zinc-500 hover:text-red-500"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Xóa lọc
        </Button>
      )}

      {/* View toggle - pushed to right */}
      <div className="ml-auto flex items-center gap-1 border border-[var(--line-soft)] rounded-lg p-0.5 bg-zinc-50">
        <button
          onClick={() => set({ view: "kanban" })}
          className={`p-1.5 rounded-md transition-all ${
            filters.view === "kanban"
              ? "bg-white shadow-sm text-indigo-600"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
          title="Kanban view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => set({ view: "list" })}
          className={`p-1.5 rounded-md transition-all ${
            filters.view === "list"
              ? "bg-white shadow-sm text-indigo-600"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
          title="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Áp dụng filter state lên mảng tasks */
export function applyFilters(tasks: Task[], f: FilterState): Task[] {
  const now = new Date();
  return tasks.filter((t) => {
    if (f.search && !t.title.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.status && t.status !== f.status) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.taskType && t.task_type !== f.taskType) return false;
    if (f.assigneeId && t.assignee_id !== f.assigneeId) return false;
    if (f.overdueOnly) {
      if (!t.due_date || t.status === "done" || t.status === "cancelled") return false;
      if (new Date(t.due_date) >= now) return false;
    }
    return true;
  });
}
