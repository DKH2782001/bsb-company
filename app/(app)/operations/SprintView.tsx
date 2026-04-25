"use client";

import { useState, useTransition } from "react";
import type { Task, Sprint, Employee } from "@/types/domain";
import { getSprintHealth, calculateSprintMetrics, getBacklogTasks, formatDaysLeft, FIBONACCI_POINTS } from "./sprint-utils";
import { assignTaskToSprintAction, createSprintAction, startSprintAction, completeSprintAction, updateTaskAction } from "@/app/(app)/workspace/actions";

// ============================================
// SPRINT VIEW — ported from AI Task Tracker
// ============================================

type SprintViewProps = {
  tasks: Task[];
  sprints: Sprint[];
  employees: Employee[];
};

export default function SprintView({ tasks, sprints, employees }: SprintViewProps) {
  const activeSprint = sprints.find((s) => s.status === "active") || null;
  const planningSprint = sprints.find((s) => s.status === "planning") || null;
  const currentSprint = activeSprint || planningSprint;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [storyPointsTaskId, setStoryPointsTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const backlogTasks = getBacklogTasks(tasks);
  const sprintTasks = currentSprint ? tasks.filter((t) => t.sprint_id === currentSprint.id) : [];

  function handleAssignToSprint(taskId: string) {
    if (!currentSprint) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("sprintId", currentSprint.id);
      await assignTaskToSprintAction(fd);
    });
  }

  function handleRemoveFromSprint(taskId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      await assignTaskToSprintAction(fd);
    });
  }

  function handleSetStoryPoints(taskId: string, points: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("storyPoints", String(points));
      await updateTaskAction(fd);
      setStoryPointsTaskId(null);
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
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md">
            ➕ Tạo Sprint mới
          </button>
        </div>
        <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-slate-300">
          <div className="text-5xl mb-4">🏃</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có Sprint nào</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Bắt đầu quản lý công việc theo Agile Scrum bằng cách tạo Sprint đầu tiên!</p>
          <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md">
            ➕ Tạo Sprint đầu tiên
          </button>
        </div>
        {showCreateModal && <CreateSprintModal onClose={() => setShowCreateModal(false)} sprints={sprints} />}
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
            {currentSprint.status === "planning" && (
              <button onClick={() => { startTransition(async () => { const fd = new FormData(); fd.set("sprintId", currentSprint.id); await startSprintAction(fd); }); }} disabled={sprintTasks.length === 0 || isPending} className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50 transition-all shadow-md">
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

      {/* Main: Backlog + Sprint Panel */}
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
              <BacklogCard key={task.id} task={task} employees={employees} onAdd={() => handleAssignToSprint(task.id)} onSetPoints={() => setStoryPointsTaskId(task.id)} isPending={isPending} />
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
              <SprintTaskCard key={task.id} task={task} employees={employees} onRemove={() => handleRemoveFromSprint(task.id)} onSetPoints={() => setStoryPointsTaskId(task.id)} isPending={isPending} />
            ))}
          </div>
        </div>
      </div>

      {/* Sprint History */}
      {sprints.filter((s) => s.status === "completed").length > 0 && (
        <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-3">📚 Sprint History</h3>
          <div className="space-y-2">
            {sprints.filter((s) => s.status === "completed").map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="font-medium text-sm text-slate-700">{s.name}</span>
                  <span className="text-xs text-slate-500 ml-2">{s.start_date} → {s.end_date}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-600">
                  <span>Velocity: <strong>{s.velocity ?? "—"}</strong></span>
                  <span>Rate: <strong>{s.completion_rate ? `${s.completion_rate}%` : "—"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateSprintModal onClose={() => setShowCreateModal(false)} sprints={sprints} />}
      {showCompleteModal && activeSprint && <CompleteSprintModal sprint={activeSprint} tasks={tasks} onClose={() => setShowCompleteModal(false)} />}
      {storyPointsTaskId && <StoryPointsModal taskId={storyPointsTaskId} task={tasks.find((t) => t.id === storyPointsTaskId)!} onSelect={handleSetStoryPoints} onClose={() => setStoryPointsTaskId(null)} />}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function BacklogCard({ task, employees, onAdd, onSetPoints, isPending }: { task: Task; employees: Employee[]; onAdd: () => void; onSetPoints: () => void; isPending: boolean }) {
  const emp = employees.find((e) => e.id === task.assignee_id);
  const prioColors: Record<string, string> = { urgent: "bg-red-500", high: "bg-orange-500", normal: "bg-blue-500", low: "bg-emerald-500" };
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${prioColors[task.priority] || "bg-slate-400"}`}>{task.priority}</span>
          {task.story_points && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-white">{task.story_points} pts</span>}
          {emp && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">👤 {emp.full_name.split(" ").pop()}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onSetPoints} className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-xs" title="Story Points">✏️</button>
        <button onClick={onAdd} disabled={isPending} className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs" title="Thêm vào Sprint">➕</button>
      </div>
    </div>
  );
}

function SprintTaskCard({ task, employees, onRemove, onSetPoints, isPending }: { task: Task; employees: Employee[]; onRemove: () => void; onSetPoints: () => void; isPending: boolean }) {
  const emp = employees.find((e) => e.id === task.assignee_id);
  const statusColors: Record<string, string> = { todo: "bg-slate-400", in_progress: "bg-amber-500", review: "bg-cyan-500", blocked: "bg-red-500", done: "bg-emerald-500" };
  const statusLabel: Record<string, string> = { todo: "To do", in_progress: "Đang làm", review: "Review", blocked: "Blocked", done: "Done" };
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-700"}`}>{task.title}</p>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${statusColors[task.status] || "bg-slate-400"}`}>{statusLabel[task.status] || task.status}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-white">{task.story_points || 0} pts</span>
          {emp && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">👤 {emp.full_name.split(" ").pop()}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onSetPoints} className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-xs">✏️</button>
        <button onClick={onRemove} disabled={isPending} className="p-1.5 rounded bg-red-500 hover:bg-red-600 text-white text-xs" title="Xóa khỏi Sprint">←</button>
      </div>
    </div>
  );
}

// ============================================
// MODALS
// ============================================

function CreateSprintModal({ onClose, sprints }: { onClose: () => void; sprints: Sprint[] }) {
  const [isPending, startTransition] = useTransition();
  const count = sprints.length + 1;
  const now = new Date();
  const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createSprintAction(fd);
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

function CompleteSprintModal({ sprint, tasks, onClose }: { sprint: Sprint; tasks: Task[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const metrics = calculateSprintMetrics(sprint, tasks);

  function handleComplete() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("sprintId", sprint.id);
      fd.set("velocity", String(metrics.velocity));
      fd.set("completedPoints", String(metrics.completedPoints));
      fd.set("carryOverPoints", String(metrics.carryOverPoints));
      fd.set("completionRate", String(metrics.completionRate));
      await completeSprintAction(fd);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-slate-800">⏹️ Kết thúc Sprint</h2>
        <p className="text-sm text-slate-500">Bạn chắc chắn muốn kết thúc <strong>{sprint.name}</strong>?</p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-emerald-50 rounded-lg p-3"><div className="text-xl font-bold text-emerald-600">{metrics.taskCount.completed}</div><div className="text-xs text-slate-500">Hoàn thành</div></div>
          <div className="bg-amber-50 rounded-lg p-3"><div className="text-xl font-bold text-amber-600">{metrics.taskCount.carriedOver}</div><div className="text-xs text-slate-500">Carry Over</div></div>
          <div className="bg-indigo-50 rounded-lg p-3"><div className="text-xl font-bold text-indigo-600">{metrics.velocity}</div><div className="text-xs text-slate-500">Velocity</div></div>
          <div className="bg-purple-50 rounded-lg p-3"><div className="text-xl font-bold text-purple-600">{metrics.completionRate}%</div><div className="text-xs text-slate-500">Completion</div></div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Hủy</button>
          <button onClick={handleComplete} disabled={isPending} className="px-5 py-2 rounded-lg text-sm text-white font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50">
            {isPending ? "Đang xử lý..." : "⏹️ Kết thúc"}
          </button>
        </div>
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
