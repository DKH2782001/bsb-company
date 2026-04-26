"use client";

import { useState, useMemo } from "react";
import type { Sprint, Task } from "@/types/domain";
import { calculateSprintMetrics } from "./sprint-utils";

type Props = {
  sprints: Sprint[];
  tasks: Task[];
  onClose: () => void;
};

export function SprintHistoryModal({ sprints, tasks, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"newest" | "oldest" | "velocity">("newest");
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = sprints.filter((s) => s.status === "completed");
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    if (order === "newest") list = [...list].sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at));
    if (order === "oldest") list = [...list].sort((a, b) => (a.completed_at ?? a.created_at).localeCompare(b.completed_at ?? b.created_at));
    if (order === "velocity") list = [...list].sort((a, b) => (b.velocity ?? 0) - (a.velocity ?? 0));
    return list;
  }, [sprints, search, order]);

  const detail = detailId ? sprints.find((s) => s.id === detailId) : null;
  const detailTasks = detail ? tasks.filter((t) => t.sprint_id === detail.id) : [];

  const totalSprints = filtered.length;
  const avgVelocity = totalSprints > 0 ? (filtered.reduce((s, x) => s + (x.velocity ?? 0), 0) / totalSprints) : 0;
  const avgCompletion = totalSprints > 0 ? (filtered.reduce((s, x) => s + (x.completion_rate ?? 0), 0) / totalSprints) : 0;
  const totalDonePts = filtered.reduce((s, x) => s + (x.completed_points ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">📚 Lịch sử Sprint</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {/* Filter bar */}
          <div className="flex gap-2 flex-wrap">
            <input
              placeholder="🔍 Tìm sprint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <select value={order} onChange={(e) => setOrder(e.target.value as typeof order)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="velocity">Velocity cao nhất</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard color="indigo" label="Tổng Sprint" value={String(totalSprints)} />
            <StatCard color="pink" label="Avg Velocity" value={avgVelocity.toFixed(1)} />
            <StatCard color="cyan" label="Avg Completion" value={`${avgCompletion.toFixed(1)}%`} />
            <StatCard color="emerald" label="Tổng Points đã xong" value={String(totalDonePts)} />
          </div>

          {/* Sprint cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">Chưa có sprint hoàn thành nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((s) => {
                const metrics = calculateSprintMetrics(s, tasks);
                return (
                  <div key={s.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-sm text-slate-800">{s.name}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">✓ Completed</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-2">{s.start_date} → {s.end_date}</div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-2">
                      <Mini label="Velocity" value={String(s.velocity ?? 0)} color="text-indigo-600" />
                      <Mini label="Hoàn thành" value={`${s.completion_rate ?? 0}%`} color="text-emerald-600" />
                      <Mini label="Tasks" value={String(metrics.taskCount.planned)} color="text-slate-700" />
                    </div>
                    <BarMiniChart metrics={metrics} />
                    <button
                      onClick={() => setDetailId(s.id)}
                      className="mt-2 w-full text-xs py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium"
                    >
                      Chi tiết
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Đóng</button>
        </div>
      </div>

      {detail && (
        <SprintDetailDrawer sprint={detail} tasks={detailTasks} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

function StatCard({ color, label, value }: { color: "indigo" | "pink" | "cyan" | "emerald"; label: string; value: string }) {
  const map = {
    indigo: "from-indigo-500 to-purple-500",
    pink: "from-pink-500 to-rose-500",
    cyan: "from-cyan-500 to-sky-500",
    emerald: "from-emerald-500 to-teal-500",
  };
  return (
    <div className={`rounded-xl p-3 text-white bg-gradient-to-br ${map[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function BarMiniChart({ metrics }: { metrics: ReturnType<typeof calculateSprintMetrics> }) {
  const total = Math.max(1, metrics.taskCount.planned);
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
        <div className="bg-emerald-500" style={{ width: seg(metrics.taskCount.completed) }} />
        <div className="bg-amber-500" style={{ width: seg(metrics.taskCount.carriedOver) }} />
        <div className="bg-red-400" style={{ width: seg(metrics.taskCount.cancelled) }} />
      </div>
      <div className="flex justify-between text-[9px] text-slate-500 mt-1">
        <span>✓ {metrics.taskCount.completed}</span>
        <span>↻ {metrics.taskCount.carriedOver}</span>
        <span>✗ {metrics.taskCount.cancelled}</span>
      </div>
    </div>
  );
}

function SprintDetailDrawer({ sprint, tasks, onClose }: { sprint: Sprint; tasks: Task[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">{sprint.name}</h3>
            <div className="text-xs text-slate-500">{sprint.start_date} → {sprint.end_date}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {sprint.goal && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Mục tiêu</div>
              <div className="text-sm text-slate-700">{sprint.goal}</div>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 text-center">
            <Mini label="Velocity" value={String(sprint.velocity ?? 0)} color="text-indigo-600" />
            <Mini label="Done pts" value={String(sprint.completed_points ?? 0)} color="text-emerald-600" />
            <Mini label="Carry pts" value={String(sprint.carry_over_points ?? 0)} color="text-amber-600" />
            <Mini label="Hoàn thành" value={`${sprint.completion_rate ?? 0}%`} color="text-purple-600" />
          </div>

          {sprint.retrospective && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RetroPanel title="✅ Đã làm tốt" items={sprint.retrospective.went_well} color="emerald" />
              <RetroPanel title="⚠️ Cần lưu ý" items={sprint.retrospective.to_improve} color="amber" />
              <RetroPanel title="🎯 Action" items={sprint.retrospective.action_items} color="indigo" />
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Tasks ({tasks.length})</div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {tasks.map((t) => (
                <div key={t.id} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-50 text-xs">
                  <span className={t.status === "done" ? "line-through text-slate-400" : "text-slate-700"}>{t.title}</span>
                  <span className="text-[10px] text-slate-500">{t.status} · {t.story_points ?? 0}p</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RetroPanel({ title, items, color }: { title: string; items: string[]; color: "emerald" | "amber" | "indigo" }) {
  const map = { emerald: "bg-emerald-50 border-emerald-200", amber: "bg-amber-50 border-amber-200", indigo: "bg-indigo-50 border-indigo-200" };
  return (
    <div className={`rounded-lg border ${map[color]} p-3`}>
      <div className="text-xs font-semibold text-slate-700 mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-[11px] text-slate-400 italic">Chưa có ghi chú</div>
      ) : (
        <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  );
}
