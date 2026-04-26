"use client";

import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List, X, AlertTriangle, CheckSquare } from "lucide-react";
import type { Task, Employee, Department } from "@/types/domain";
import { bulkUpdateTasksAction } from "@/app/(app)/workspace/actions";
import { MultiSelect, type MultiSelectOption } from "./MultiSelect";
import { isTaskOverdue } from "./sprint-utils";

export type FilterState = {
  search: string;
  status: string[];
  priority: string[];
  taskType: string[];
  assigneeId: string[];
  departmentId: string[];
  overdueOnly: boolean;
  view: "kanban" | "list";
};

export const EMPTY_FILTERS: FilterState = {
  search: "",
  status: [],
  priority: [],
  taskType: [],
  assigneeId: [],
  departmentId: [],
  overdueOnly: false,
  view: "kanban",
};

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: "todo",        label: "To do",     swatch: "bg-zinc-400" },
  { value: "in_progress", label: "Đang làm",  swatch: "bg-amber-500" },
  { value: "review",      label: "Review",    swatch: "bg-violet-500" },
  { value: "blocked",     label: "Blocked",   swatch: "bg-red-500" },
  { value: "done",        label: "Hoàn thành", swatch: "bg-emerald-500" },
  { value: "cancelled",   label: "Đã huỷ",    swatch: "bg-zinc-300" },
];

const PRIORITY_OPTIONS: MultiSelectOption[] = [
  { value: "urgent", label: "Urgent", swatch: "bg-red-500" },
  { value: "high",   label: "High",   swatch: "bg-orange-500" },
  { value: "normal", label: "Normal", swatch: "bg-yellow-500" },
  { value: "low",    label: "Low",    swatch: "bg-emerald-500" },
];

const TASK_TYPE_OPTIONS: MultiSelectOption[] = [
  { value: "growth",      label: "Growth" },
  { value: "maintenance", label: "Maintenance" },
  { value: "admin",       label: "Admin" },
  { value: "urgent",      label: "Urgent" },
];

type Props = {
  employees: Employee[];
  departments: Department[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  selectedIds: string[];
  onClearSelection: () => void;
};

export function TaskFilterBar({ employees, departments, filters, onChange, selectedIds, onClearSelection }: Props) {
  const set = useCallback(
    (patch: Partial<FilterState>) => onChange({ ...filters, ...patch }),
    [filters, onChange],
  );

  const [isPending, startTransition] = useTransition();

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.status.forEach((v) =>
    activeChips.push({
      key: `status:${v}`,
      label: `Trạng thái: ${STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v}`,
      onRemove: () => set({ status: filters.status.filter((x) => x !== v) }),
    }),
  );
  filters.priority.forEach((v) =>
    activeChips.push({
      key: `priority:${v}`,
      label: `Ưu tiên: ${PRIORITY_OPTIONS.find((o) => o.value === v)?.label ?? v}`,
      onRemove: () => set({ priority: filters.priority.filter((x) => x !== v) }),
    }),
  );
  filters.taskType.forEach((v) =>
    activeChips.push({
      key: `type:${v}`,
      label: `Loại: ${TASK_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v}`,
      onRemove: () => set({ taskType: filters.taskType.filter((x) => x !== v) }),
    }),
  );
  filters.assigneeId.forEach((v) =>
    activeChips.push({
      key: `assignee:${v}`,
      label: `Assignee: ${employees.find((e) => e.id === v)?.full_name ?? v}`,
      onRemove: () => set({ assigneeId: filters.assigneeId.filter((x) => x !== v) }),
    }),
  );
  filters.departmentId.forEach((v) =>
    activeChips.push({
      key: `dept:${v}`,
      label: `Phòng ban: ${departments.find((d) => d.id === v)?.name ?? v}`,
      onRemove: () => set({ departmentId: filters.departmentId.filter((x) => x !== v) }),
    }),
  );
  if (filters.overdueOnly) {
    activeChips.push({
      key: "overdue",
      label: "Chỉ quá hạn",
      onRemove: () => set({ overdueOnly: false }),
    });
  }

  const hasActiveFilters = activeChips.length > 0 || filters.search;

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
          <span className="text-sm font-semibold text-indigo-700">{selectedIds.length} task đã chọn</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("done")} disabled={isPending}
            className="h-7 text-[11px] bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100">✅ Done</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("in_progress")} disabled={isPending}
            className="h-7 text-[11px] bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100">⚡ In Progress</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("todo")} disabled={isPending}
            className="h-7 text-[11px] bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100">📋 To Do</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("blocked")} disabled={isPending}
            className="h-7 text-[11px] bg-red-50 border-red-300 text-red-700 hover:bg-red-100">🚫 Blocked</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("cancelled")} disabled={isPending}
            className="h-7 text-[11px] bg-zinc-50 border-zinc-300 text-zinc-500 hover:bg-zinc-100">❌ Cancel</Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="ml-auto h-7 text-[11px] text-zinc-500 hover:text-zinc-700">
          <X className="h-3 w-3 mr-0.5" /> Bỏ chọn
        </Button>
        {isPending && <span className="text-xs text-indigo-500 animate-pulse">Đang cập nhật...</span>}
      </div>
    );
  }

  // ── Normal filter bar ───────────────────────────────────────────────────────
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-[var(--line-soft)] shadow-sm">
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

        <MultiSelect placeholder="Trạng thái" options={STATUS_OPTIONS} values={filters.status} onChange={(v) => set({ status: v })} />
        <MultiSelect placeholder="Ưu tiên" options={PRIORITY_OPTIONS} values={filters.priority} onChange={(v) => set({ priority: v })} />
        <MultiSelect placeholder="Loại" options={TASK_TYPE_OPTIONS} values={filters.taskType} onChange={(v) => set({ taskType: v })} />
        <MultiSelect placeholder="Assignee" options={employees.map((e) => ({ value: e.id, label: e.full_name }))} values={filters.assigneeId} onChange={(v) => set({ assigneeId: v })} />
        <MultiSelect placeholder="Phòng ban" options={departments.map((d) => ({ value: d.id, label: d.name }))} values={filters.departmentId} onChange={(v) => set({ departmentId: v })} />

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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...EMPTY_FILTERS, view: filters.view })}
            className="h-9 text-xs text-zinc-500 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Xóa lọc
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1 border border-[var(--line-soft)] rounded-lg p-0.5 bg-zinc-50">
          <button onClick={() => set({ view: "kanban" })}
            className={`p-1.5 rounded-md transition-all ${filters.view === "kanban" ? "bg-white shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"}`}
            title="Kanban view">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => set({ view: "list" })}
            className={`p-1.5 rounded-md transition-all ${filters.view === "list" ? "bg-white shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-600"}`}
            title="List view">
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {activeChips.map((c) => (
            <span key={c.key} className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-medium">
              {c.label}
              <button onClick={c.onRemove} className="hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Áp dụng filter state lên mảng tasks */
export function applyFilters(tasks: Task[], f: FilterState): Task[] {
  return tasks.filter((t) => {
    if (f.search && !t.title.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.status.length > 0 && !f.status.includes(t.status)) return false;
    if (f.priority.length > 0 && !f.priority.includes(t.priority)) return false;
    if (f.taskType.length > 0 && !f.taskType.includes(t.task_type)) return false;
    if (f.assigneeId.length > 0 && (!t.assignee_id || !f.assigneeId.includes(t.assignee_id))) return false;
    if (f.departmentId.length > 0 && (!t.department_id || !f.departmentId.includes(t.department_id))) return false;
    if (f.overdueOnly && !isTaskOverdue(t)) return false;
    return true;
  });
}
