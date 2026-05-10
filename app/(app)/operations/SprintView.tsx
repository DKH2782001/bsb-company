"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Task, Sprint, Employee, Kpi, KpiTarget } from "@/types/domain";
import { getSprintHealth, calculateSprintMetrics, getBacklogTasks, formatDaysLeft, FIBONACCI_POINTS, isTaskOverdue } from "./sprint-utils";
import { assignTaskToSprintAction, createSprintAction, startSprintAction, completeSprintAction, updateTaskAction } from "@/app/(app)/workspace/actions";
import { SprintKanban } from "./SprintKanban";
import { SprintHistoryModal } from "./SprintHistoryModal";
import { SprintAnalyticsModal } from "./SprintAnalyticsModal";
import { MultiSelect } from "./MultiSelect";
import { QuickCreateTaskDialog } from "./QuickCreateTaskDialog";
import { Plus, X, Search, AlertTriangle } from "lucide-react";

type SprintFilters = {
  search: string;
  priority: string[];
  status: string[];
  assigneeId: string[];
  overdueOnly: boolean;
};

const EMPTY_SPRINT_FILTERS: SprintFilters = {
  search: "",
  priority: [],
  status: [],
  assigneeId: [],
  overdueOnly: false,
};

const SPRINT_PRIORITY_OPTS = [
  { value: "urgent", label: "Urgent", swatch: "bg-red-500" },
  { value: "high",   label: "High",   swatch: "bg-orange-500" },
  { value: "normal", label: "Normal", swatch: "bg-yellow-500" },
  { value: "low",    label: "Low",    swatch: "bg-emerald-500" },
];
const SPRINT_STATUS_OPTS = [
  { value: "todo",        label: "To do",     swatch: "bg-zinc-400" },
  { value: "in_progress", label: "Đang làm",  swatch: "bg-amber-500" },
  { value: "review",      label: "Review",    swatch: "bg-violet-500" },
  { value: "blocked",     label: "Blocked",   swatch: "bg-red-500" },
  { value: "done",        label: "Hoàn thành", swatch: "bg-emerald-500" },
];

function applySprintFilters(tasks: Task[], f: SprintFilters): Task[] {
  return tasks.filter((t) => {
    if (f.search && !t.title.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.priority.length > 0 && !f.priority.includes(t.priority)) return false;
    if (f.status.length > 0 && !f.status.includes(t.status)) return false;
    if (f.assigneeId.length > 0 && (!t.assignee_id || !f.assigneeId.includes(t.assignee_id))) return false;
    if (f.overdueOnly && !isTaskOverdue(t)) return false;
    return true;
  });
}

// ============================================
// SPRINT VIEW — ported from AI Task Tracker
// ============================================

type SprintViewProps = {
  tasks: Task[];
  sprints: Sprint[];
  employees: Employee[];
  kpis?: Kpi[];
  kpiTargets?: KpiTarget[];
  onOpenDetail?: (id: string) => void;
};

export default function SprintView({ tasks, sprints, employees, kpis = [], kpiTargets = [], onOpenDetail }: SprintViewProps) {
  const router = useRouter();
  const [createdSprints, setCreatedSprints] = useState<Sprint[]>([]);
  const createdSprintById = new Map(createdSprints.map((sprint) => [sprint.id, sprint]));
  const visibleSprints = [
    ...sprints.map((sprint) => createdSprintById.get(sprint.id) ?? sprint),
    ...createdSprints.filter((created) => !sprints.some((sprint) => sprint.id === created.id)),
  ];
  const activeSprint = visibleSprints.find((s) => s.status === "active") || null;
  const planningSprint = visibleSprints.find((s) => s.status === "planning") || null;
  const currentSprint = activeSprint || planningSprint;
  const completedSprints = [...visibleSprints]
    .filter((s) => s.status === "completed")
    .sort((a, b) =>
      (b.completed_at ?? b.end_date ?? b.created_at).localeCompare(
        a.completed_at ?? a.end_date ?? a.created_at,
      ),
    );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [quickCreateMode, setQuickCreateMode] = useState<"normal" | "urgent" | null>(null);
  const [storyPointsTaskId, setStoryPointsTaskId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"planning" | "kanban">(activeSprint ? "kanban" : "planning");
  const [filters, setFilters] = useState<SprintFilters>(EMPTY_SPRINT_FILTERS);
  const [isPending, startTransition] = useTransition();

  const backlogAll = getBacklogTasks(tasks);
  const sprintTasksAll = currentSprint ? tasks.filter((t) => t.sprint_id === currentSprint.id) : [];
  const backlogTasks = applySprintFilters(backlogAll, filters);
  const sprintTasks = applySprintFilters(sprintTasksAll, filters);
  const averageVelocity =
    completedSprints.length > 0
      ? completedSprints.reduce((sum, sprint) => sum + (sprint.velocity ?? 0), 0) / completedSprints.length
      : 0;
  const averageCompletion =
    completedSprints.length > 0
      ? completedSprints.reduce((sum, sprint) => sum + (sprint.completion_rate ?? 0), 0) / completedSprints.length
      : 0;
  const totalCompletedPoints = completedSprints.reduce(
    (sum, sprint) => sum + (sprint.completed_points ?? 0),
    0,
  );

  const filterChips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.priority.forEach((v) => filterChips.push({
    key: `p:${v}`,
    label: `Ưu tiên: ${SPRINT_PRIORITY_OPTS.find((o) => o.value === v)?.label ?? v}`,
    onRemove: () => setFilters((f) => ({ ...f, priority: f.priority.filter((x) => x !== v) })),
  }));
  filters.status.forEach((v) => filterChips.push({
    key: `s:${v}`,
    label: `Trạng thái: ${SPRINT_STATUS_OPTS.find((o) => o.value === v)?.label ?? v}`,
    onRemove: () => setFilters((f) => ({ ...f, status: f.status.filter((x) => x !== v) })),
  }));
  filters.assigneeId.forEach((v) => filterChips.push({
    key: `a:${v}`,
    label: `Assignee: ${employees.find((e) => e.id === v)?.full_name ?? v}`,
    onRemove: () => setFilters((f) => ({ ...f, assigneeId: f.assigneeId.filter((x) => x !== v) })),
  }));
  if (filters.overdueOnly) filterChips.push({ key: "o", label: "Chỉ quá hạn", onRemove: () => setFilters((f) => ({ ...f, overdueOnly: false })) });
  const hasActiveFilters = filterChips.length > 0 || filters.search;

  function handleAssignToSprint(taskId: string) {
    if (!currentSprint) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("sprintId", currentSprint.id);
      await assignTaskToSprintAction(fd);
      router.refresh();
    });
  }

  function handleRemoveFromSprint(taskId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      await assignTaskToSprintAction(fd);
      router.refresh();
    });
  }

  function handleSetStoryPoints(taskId: string, points: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("storyPoints", String(points));
      await updateTaskAction(fd);
      setStoryPointsTaskId(null);
      router.refresh();
    });
  }

  function upsertLocalSprint(next: Sprint) {
    setCreatedSprints((prev) => {
      if (prev.some((sprint) => sprint.id === next.id)) {
        return prev.map((sprint) => (sprint.id === next.id ? next : sprint));
      }
      return [...prev, next];
    });
  }

  // No sprint → Empty state
  if (!currentSprint) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">🏃 Sprint Management</h2>
            <p className="text-sm text-slate-500">Quản lý công việc theo Agile Scrum</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowAnalyticsModal(true)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all">
              📊 Analytics
            </button>
            <button onClick={() => setShowHistoryModal(true)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
              📚 Lịch sử
            </button>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md">
              ➕ Tạo Sprint mới
            </button>
          </div>
        </div>
        <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-slate-300">
          <div className="text-5xl mb-4">🏃</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có Sprint nào</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Bắt đầu quản lý công việc theo Agile Scrum bằng cách tạo Sprint đầu tiên!</p>
          <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md">
            ➕ Tạo Sprint đầu tiên
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
          <SprintHistoryPreview completedSprints={completedSprints} onOpen={() => setShowHistoryModal(true)} />
          <SprintAnalyticsPreview
            completedCount={completedSprints.length}
            averageVelocity={averageVelocity}
            averageCompletion={averageCompletion}
            totalCompletedPoints={totalCompletedPoints}
            onOpen={() => setShowAnalyticsModal(true)}
          />
        </div>
        {showCreateModal && (
          <CreateSprintModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(sprint) => setCreatedSprints((prev) => [...prev, sprint])}
            sprints={visibleSprints}
          />
        )}
        {showHistoryModal && <SprintHistoryModal sprints={visibleSprints} tasks={tasks} onClose={() => setShowHistoryModal(false)} />}
        {showAnalyticsModal && <SprintAnalyticsModal sprints={visibleSprints} tasks={tasks} onClose={() => setShowAnalyticsModal(false)} />}
      </div>
    );
  }

  // Active or Planning sprint
  const health = activeSprint ? getSprintHealth(activeSprint, sprintTasks) : null;
  const metrics = calculateSprintMetrics(currentSprint, tasks);
  const totalPoints = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
  const capPct = currentSprint.capacity > 0 ? Math.min(100, (totalPoints / currentSprint.capacity) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Sprint Header */}
      <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-sm border border-slate-200/60">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-slate-800">{currentSprint.name}</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${currentSprint.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {currentSprint.status === "active" ? "🟢 Active" : "📋 Planning"}
              </span>
              {health && <span className={`text-xs font-medium ${health.color}`}>{health.label}</span>}
            </div>
            <p className="text-sm text-slate-500 mb-2">{currentSprint.goal || "Chưa có mục tiêu"}</p>
            <div className="flex gap-4 text-xs text-slate-500">
              <span>📅 {currentSprint.start_date} → {currentSprint.end_date}</span>
              {health && <span>⏰ {formatDaysLeft(health.daysLeft)}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setQuickCreateMode("normal")}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all"
            >
              <Plus className="h-4 w-4" />
              Thêm task
            </button>
            <button
              onClick={() => setQuickCreateMode("urgent")}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all"
            >
              <AlertTriangle className="h-4 w-4" />
              Khẩn cấp
            </button>
            <button onClick={() => setShowAnalyticsModal(true)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all">
              📊 Analytics
            </button>
            <button onClick={() => setShowHistoryModal(true)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
              📚 Lịch sử
            </button>
            {currentSprint.status === "planning" && (
              <button onClick={() => { startTransition(async () => { const fd = new FormData(); fd.set("sprintId", currentSprint.id); await startSprintAction(fd); upsertLocalSprint({ ...currentSprint, status: "active" }); router.refresh(); }); }} disabled={isPending} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50 transition-all shadow-md">
                🚀 Bắt đầu Sprint
              </button>
            )}
            {currentSprint.status === "active" && (
              <button onClick={() => setShowCompleteModal(true)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-red-500 hover:bg-red-600 transition-all shadow-md">
                ⏹️ Kết thúc Sprint
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {health && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Tiến độ: {metrics.taskCount.completed}/{metrics.taskCount.planned} tasks ({metrics.completionRate}%)</span>
              <span>Thời gian: {health.timePercentage.toFixed(0)}%</span>
            </div>
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${health.completionPct}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-500" style={{ left: `${health.timePercentage}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Tổng Tasks", value: metrics.taskCount.planned, color: "text-slate-800" },
          { label: "Hoàn thành", value: metrics.taskCount.completed, color: "text-emerald-600" },
          { label: "Đang làm", value: sprintTasks.filter((t) => t.status === "in_progress").length, color: "text-amber-600" },
          { label: "Chưa bắt đầu", value: sprintTasks.filter((t) => t.status === "todo").length, color: "text-slate-500" },
          { label: "Story Points", value: `${metrics.completedPoints}/${totalPoints}`, color: "text-indigo-600" },
          { label: "Velocity", value: metrics.velocity, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white/80 rounded-xl p-3 text-center border border-slate-200/60">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sprint Filter Bar */}
      <div>
        <div className="flex flex-wrap items-center gap-2 p-3 bg-white/80 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              placeholder="Tìm task trong sprint/backlog..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-8 pr-3 h-9 rounded-lg border border-slate-200 bg-white text-sm"
            />
          </div>
          <MultiSelect placeholder="Ưu tiên" options={SPRINT_PRIORITY_OPTS} values={filters.priority} onChange={(v) => setFilters((f) => ({ ...f, priority: v }))} />
          <MultiSelect placeholder="Trạng thái" options={SPRINT_STATUS_OPTS} values={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
          <MultiSelect placeholder="Assignee" options={employees.map((e) => ({ value: e.id, label: e.full_name }))} values={filters.assigneeId} onChange={(v) => setFilters((f) => ({ ...f, assigneeId: v }))} />
          <button
            onClick={() => setFilters((f) => ({ ...f, overdueOnly: !f.overdueOnly }))}
            className={`flex items-center gap-1 h-9 px-3 rounded-lg border text-xs font-medium transition-all ${filters.overdueOnly ? "bg-red-50 border-red-300 text-red-700" : "border-slate-200 bg-white text-slate-500 hover:text-red-600"}`}
          >
            <AlertTriangle className="h-3 w-3" />
            Quá hạn
          </button>
          {hasActiveFilters && (
            <button onClick={() => setFilters(EMPTY_SPRINT_FILTERS)} className="h-9 px-3 text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
              <X className="h-3.5 w-3.5" />
              Xoá lọc
            </button>
          )}
        </div>
        {filterChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {filterChips.map((c) => (
              <span key={c.key} className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-medium">
                {c.label}
                <button onClick={c.onRemove} className="hover:text-red-500"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* View switcher (chỉ khi sprint active) */}
      {currentSprint.status === "active" && (
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveView("kanban")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === "kanban" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            🎯 Kanban
          </button>
          <button
            onClick={() => setActiveView("planning")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === "planning" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            📋 Backlog / Sprint
          </button>
        </div>
      )}

      {/* Sprint Kanban (active + kanban view) */}
      {currentSprint.status === "active" && activeView === "kanban" && (
        <SprintKanban tasks={sprintTasks} employees={employees} onOpenDetail={onOpenDetail} />
      )}

      {/* Main: Backlog + Sprint Panel (planning view hoặc planning sprint) */}
      {(currentSprint.status === "planning" || activeView === "planning") && (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Backlog */}
        <div className="lg:col-span-2 bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-700">📋 Backlog</h3>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{backlogTasks.length} tasks</span>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {backlogTasks.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Tất cả tasks đã được gắn sprint</p>
            ) : backlogTasks.map((task) => (
              <BacklogCard key={task.id} task={task} employees={employees} onAdd={() => handleAssignToSprint(task.id)} onSetPoints={() => setStoryPointsTaskId(task.id)} onOpen={() => onOpenDetail?.(task.id)} isPending={isPending} />
            ))}
          </div>
        </div>

        {/* Sprint Tasks */}
        <div className="lg:col-span-3 bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-700">🎯 Sprint Tasks</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{totalPoints} / {currentSprint.capacity || "∞"} pts</span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${capPct > 100 ? "bg-red-500" : capPct > 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(capPct, 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {sprintTasks.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Thêm tasks từ Backlog vào Sprint</p>
            ) : sprintTasks.map((task) => (
              <SprintTaskCard key={task.id} task={task} employees={employees} onRemove={() => handleRemoveFromSprint(task.id)} onSetPoints={() => setStoryPointsTaskId(task.id)} onOpen={() => onOpenDetail?.(task.id)} isPending={isPending} />
            ))}
          </div>
        </div>
      </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <SprintHistoryPreview completedSprints={completedSprints} onOpen={() => setShowHistoryModal(true)} />
        <SprintAnalyticsPreview
          completedCount={completedSprints.length}
          averageVelocity={averageVelocity}
          averageCompletion={averageCompletion}
          totalCompletedPoints={totalCompletedPoints}
          onOpen={() => setShowAnalyticsModal(true)}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateSprintModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(sprint) => setCreatedSprints((prev) => [...prev, sprint])}
          sprints={visibleSprints}
        />
      )}
      {showCompleteModal && activeSprint && <CompleteSprintModal sprint={activeSprint} tasks={tasks} sprints={visibleSprints} onCompleted={upsertLocalSprint} onClose={() => setShowCompleteModal(false)} />}
      {showHistoryModal && <SprintHistoryModal sprints={visibleSprints} tasks={tasks} onClose={() => setShowHistoryModal(false)} />}
      {showAnalyticsModal && <SprintAnalyticsModal sprints={visibleSprints} tasks={tasks} onClose={() => setShowAnalyticsModal(false)} />}
      {storyPointsTaskId && <StoryPointsModal taskId={storyPointsTaskId} task={tasks.find((t) => t.id === storyPointsTaskId)!} onSelect={handleSetStoryPoints} onClose={() => setStoryPointsTaskId(null)} />}
      {quickCreateMode && (
        <QuickCreateTaskDialog
          sprintId={currentSprint.id}
          sprintName={currentSprint.name}
          employees={employees}
          kpis={kpis}
          sprints={visibleSprints}
          tasks={tasks}
          kpiTargets={kpiTargets}
          onClose={() => setQuickCreateMode(null)}
          defaults={
            quickCreateMode === "urgent"
              ? { priority: "urgent", taskType: "urgent", urgent: true }
              : undefined
          }
        />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function BacklogCard({ task, employees, onAdd, onSetPoints, onOpen, isPending }: { task: Task; employees: Employee[]; onAdd: () => void; onSetPoints: () => void; onOpen?: () => void; isPending: boolean }) {
  const emp = employees.find((e) => e.id === task.assignee_id);
  const prioColors: Record<string, string> = { urgent: "bg-red-500", high: "bg-orange-500", normal: "bg-blue-500", low: "bg-emerald-500" };
  return (
    <div onClick={onOpen} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${prioColors[task.priority] || "bg-slate-400"}`}>{task.priority}</span>
          {task.story_points && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-white">{task.story_points} pts</span>}
          {emp && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">👤 {emp.full_name.split(" ").pop()}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button onClick={onSetPoints} className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-xs" title="Story Points">✏️</button>
        <button onClick={onAdd} disabled={isPending} className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs" title="Thêm vào Sprint">➕</button>
      </div>
    </div>
  );
}

function SprintTaskCard({ task, employees, onRemove, onSetPoints, onOpen, isPending }: { task: Task; employees: Employee[]; onRemove: () => void; onSetPoints: () => void; onOpen?: () => void; isPending: boolean }) {
  const emp = employees.find((e) => e.id === task.assignee_id);
  const statusColors: Record<string, string> = { todo: "bg-slate-400", in_progress: "bg-amber-500", review: "bg-cyan-500", blocked: "bg-red-500", done: "bg-emerald-500" };
  const statusLabel: Record<string, string> = { todo: "To do", in_progress: "Đang làm", review: "Review", blocked: "Blocked", done: "Done" };
  return (
    <div onClick={onOpen} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-700"}`}>{task.title}</p>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${statusColors[task.status] || "bg-slate-400"}`}>{statusLabel[task.status] || task.status}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-white">{task.story_points || 0} pts</span>
          {emp && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">👤 {emp.full_name.split(" ").pop()}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button onClick={onSetPoints} className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-xs">✏️</button>
        <button onClick={onRemove} disabled={isPending} className="p-1.5 rounded bg-red-500 hover:bg-red-600 text-white text-xs" title="Xóa khỏi Sprint">←</button>
      </div>
    </div>
  );
}

function SprintHistoryPreview({
  completedSprints,
  onOpen,
}: {
  completedSprints: Sprint[];
  onOpen: () => void;
}) {
  return (
    <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700">📚 Sprint gần đây</h3>
        <button onClick={onOpen} className="text-xs text-indigo-600 hover:underline">
          Xem tất cả →
        </button>
      </div>
      {completedSprints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
          Chưa có sprint hoàn thành nào, nhưng khu vực lịch sử đã sẵn sàng.
        </div>
      ) : (
        <div className="space-y-2">
          {completedSprints.slice(0, 3).map((sprint) => (
            <div key={sprint.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="font-medium text-sm text-slate-700">{sprint.name}</span>
                <span className="text-xs text-slate-500 ml-2">
                  {sprint.start_date} → {sprint.end_date}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-slate-600">
                <span>
                  Velocity: <strong>{sprint.velocity ?? "—"}</strong>
                </span>
                <span>
                  Rate: <strong>{sprint.completion_rate ? `${sprint.completion_rate}%` : "—"}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SprintAnalyticsPreview({
  completedCount,
  averageVelocity,
  averageCompletion,
  totalCompletedPoints,
  onOpen,
}: {
  completedCount: number;
  averageVelocity: number;
  averageCompletion: number;
  totalCompletedPoints: number;
  onOpen: () => void;
}) {
  return (
    <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700">📊 Sprint analytics</h3>
        <button onClick={onOpen} className="text-xs text-indigo-600 hover:underline">
          Mở phân tích →
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-center">
          <div className="text-lg font-bold text-indigo-700">{completedCount}</div>
          <div className="text-[11px] text-slate-500">Sprint done</div>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
          <div className="text-lg font-bold text-emerald-700">{averageVelocity.toFixed(1)}</div>
          <div className="text-[11px] text-slate-500">Avg velocity</div>
        </div>
        <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-3 text-center">
          <div className="text-lg font-bold text-cyan-700">{averageCompletion.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500">Avg completion</div>
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
        {completedCount === 0
          ? "Phần phân tích đang hiện sẵn. Khi có sprint hoàn thành, biểu đồ velocity và burndown sẽ có dữ liệu."
          : `Đã hoàn thành tổng ${totalCompletedPoints} story points qua ${completedCount} sprint.`}
      </div>
    </div>
  );
}

// ============================================
// MODALS
// ============================================

function CreateSprintModal({
  onClose,
  onCreated,
  sprints,
}: {
  onClose: () => void;
  onCreated?: (sprint: Sprint) => void;
  sprints: Sprint[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const count = sprints.length + 1;
  const now = new Date();
  const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createSprintAction(fd);
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      if (result?.data) onCreated?.(result.data);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-slate-800">➕ Tạo Sprint mới</h2>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Tên Sprint *</label>
          <input name="name" defaultValue={`Sprint ${count}`} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Mục tiêu</label>
          <textarea name="goal" rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Mục tiêu chính..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Bắt đầu *</label>
            <input name="startDate" type="date" defaultValue={now.toISOString().split("T")[0]} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Kết thúc *</label>
            <input name="endDate" type="date" defaultValue={defaultEnd.toISOString().split("T")[0]} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Capacity (Story Points)</label>
          <input name="capacity" type="number" defaultValue={20} min={0} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Hủy</button>
          <button type="submit" disabled={isPending} className="px-5 py-2 rounded-lg text-sm text-white font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50">
            {isPending ? "Đang tạo..." : "💾 Tạo Sprint"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CompleteSprintModal({
  sprint,
  tasks,
  sprints,
  onCompleted,
  onClose,
}: {
  sprint: Sprint;
  tasks: Task[];
  sprints: Sprint[];
  onCompleted?: (sprint: Sprint) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const metrics = calculateSprintMetrics(sprint, tasks);

  const incompleteTasks = tasks.filter(
    (t) => t.sprint_id === sprint.id && t.status !== "done" && t.status !== "cancelled"
  );

  // Sprint kế tiếp = sprint khác đang ở planning (chưa active)
  const nextSprints = sprints.filter((s) => s.status === "planning" && s.id !== sprint.id);

  // Xử lý từng task chưa xong: backlog | cancel | next:<sprintId>
  const [dispositions, setDispositions] = useState<Record<string, string>>(
    () => Object.fromEntries(incompleteTasks.map((t) => [t.id, "backlog"]))
  );

  // Bulk apply
  function applyAll(value: string) {
    setDispositions(Object.fromEntries(incompleteTasks.map((t) => [t.id, value])));
  }

  // Retrospective state
  const [wentWell, setWentWell] = useState<string[]>([""]);
  const [toImprove, setToImprove] = useState<string[]>([""]);
  const [actionItems, setActionItems] = useState<string[]>([""]);

  function addRow(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }
  function updateRow(setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, value: string) {
    setter((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }
  function removeRow(setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) {
    setter((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleComplete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("sprintId", sprint.id);
      fd.set("velocity", String(metrics.velocity));
      fd.set("completedPoints", String(metrics.completedPoints));
      fd.set("carryOverPoints", String(metrics.carryOverPoints));
      fd.set("completionRate", String(metrics.completionRate));
      fd.set("dispositions", JSON.stringify(dispositions));
      fd.set(
        "retrospective",
        JSON.stringify({
          went_well: wentWell.map((s) => s.trim()).filter(Boolean),
          to_improve: toImprove.map((s) => s.trim()).filter(Boolean),
          action_items: actionItems.map((s) => s.trim()).filter(Boolean),
        })
      );
      await completeSprintAction(fd);
      onCompleted?.({
        ...sprint,
        status: "completed",
        completed_at: new Date().toISOString(),
        velocity: metrics.velocity,
        completed_points: metrics.completedPoints,
        carry_over_points: metrics.carryOverPoints,
        completion_rate: metrics.completionRate,
        retrospective: {
          went_well: wentWell.map((s) => s.trim()).filter(Boolean),
          to_improve: toImprove.map((s) => s.trim()).filter(Boolean),
          action_items: actionItems.map((s) => s.trim()).filter(Boolean),
        },
      });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">⏹️ Kết thúc {sprint.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-5">
          {/* Metrics summary */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-emerald-50 rounded-lg p-3"><div className="text-xl font-bold text-emerald-600">{metrics.taskCount.completed}</div><div className="text-xs text-slate-500">Hoàn thành</div></div>
            <div className="bg-amber-50 rounded-lg p-3"><div className="text-xl font-bold text-amber-600">{metrics.taskCount.carriedOver}</div><div className="text-xs text-slate-500">Chưa xong</div></div>
            <div className="bg-indigo-50 rounded-lg p-3"><div className="text-xl font-bold text-indigo-600">{metrics.velocity}</div><div className="text-xs text-slate-500">Velocity</div></div>
            <div className="bg-purple-50 rounded-lg p-3"><div className="text-xl font-bold text-purple-600">{metrics.completionRate}%</div><div className="text-xs text-slate-500">Completion</div></div>
          </div>

          {/* Disposition */}
          {incompleteTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">📦 Xử lý {incompleteTasks.length} task chưa hoàn thành</h3>
                <div className="flex gap-1 text-xs">
                  <button type="button" onClick={() => applyAll("backlog")} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Tất cả → Backlog</button>
                  <button type="button" onClick={() => applyAll("cancel")} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">Tất cả → Cancel</button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto rounded-lg border border-slate-200">
                {incompleteTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-700 truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-500">{t.status} · {t.story_points || 0} pts</div>
                    </div>
                    <select
                      value={dispositions[t.id] ?? "backlog"}
                      onChange={(e) => setDispositions((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
                    >
                      <option value="backlog">📋 Trả về Backlog</option>
                      <option value="cancel">❌ Cancel</option>
                      {nextSprints.map((s) => (
                        <option key={s.id} value={`next:${s.id}`}>➡️ {s.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {nextSprints.length === 0 && (
                <div className="text-[11px] text-slate-400 mt-1 italic">
                  💡 Tạo sprint kế tiếp (status &quot;planning&quot;) trước khi kết thúc nếu muốn chuyển task sang sprint sau.
                </div>
              )}
            </div>
          )}

          {/* Retrospective */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">📝 Retrospective</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RetroColumn title="✅ Đã làm tốt" color="emerald" rows={wentWell} onAdd={() => addRow(setWentWell)} onChange={(i, v) => updateRow(setWentWell, i, v)} onRemove={(i) => removeRow(setWentWell, i)} />
              <RetroColumn title="⚠️ Cần lưu ý" color="amber" rows={toImprove} onAdd={() => addRow(setToImprove)} onChange={(i, v) => updateRow(setToImprove, i, v)} onRemove={(i) => removeRow(setToImprove, i)} />
              <RetroColumn title="🎯 Action tiếp theo" color="indigo" rows={actionItems} onAdd={() => addRow(setActionItems)} onChange={(i, v) => updateRow(setActionItems, i, v)} onRemove={(i) => removeRow(setActionItems, i)} />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Hủy</button>
          <button onClick={handleComplete} disabled={isPending} className="px-5 py-2 rounded-lg text-sm text-white font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50">
            {isPending ? "Đang xử lý..." : "⏹️ Kết thúc Sprint"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RetroColumn({ title, color, rows, onAdd, onChange, onRemove }: { title: string; color: "emerald" | "amber" | "indigo"; rows: string[]; onAdd: () => void; onChange: (i: number, v: string) => void; onRemove: (i: number) => void }) {
  const colorMap = {
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    indigo: "bg-indigo-50 border-indigo-200",
  };
  return (
    <div className={`rounded-lg border ${colorMap[color]} p-3`}>
      <div className="text-xs font-semibold text-slate-700 mb-2">{title}</div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1">
            <input
              value={row}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder="Ghi chú..."
              className="flex-1 px-2 py-1 rounded border border-slate-200 bg-white text-xs"
            />
            {rows.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="text-xs text-slate-400 hover:text-red-500 px-1">×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={onAdd} className="text-[11px] text-slate-500 hover:text-slate-700">+ Thêm</button>
      </div>
    </div>
  );
}

function StoryPointsModal({ taskId, task, onSelect, onClose }: { taskId: string; task: Task; onSelect: (id: string, pts: number) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-slate-800">✏️ Story Points</h2>
        <p className="text-sm text-slate-500 truncate">{task.title}</p>
        <div className="grid grid-cols-4 gap-2">
          {FIBONACCI_POINTS.map((pts) => (
            <button key={pts} onClick={() => onSelect(taskId, pts)} className={`py-3 rounded-lg text-lg font-bold border-2 transition-all ${task.story_points === pts ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-200 hover:border-indigo-400 text-slate-700"}`}>
              {pts}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Đóng</button>
      </div>
    </div>
  );
}
