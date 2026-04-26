"use client";

import { useState, useMemo } from "react";
import type { Sprint, Task } from "@/types/domain";
import { calculateSprintMetrics } from "./sprint-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

type Props = {
  sprints: Sprint[];
  tasks: Task[];
  onClose: () => void;
};

export function SprintAnalyticsModal({ sprints, tasks, onClose }: Props) {
  const finishedSprints = useMemo(
    () => sprints.filter((s) => s.status === "completed").sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [sprints]
  );

  const [selectedId, setSelectedId] = useState<string>(finishedSprints.at(-1)?.id ?? sprints[0]?.id ?? "");

  const totalSprints = finishedSprints.length;
  const avgVelocity = totalSprints > 0 ? finishedSprints.reduce((s, x) => s + (x.velocity ?? 0), 0) / totalSprints : 0;
  const totalTasks = sprints.reduce((s, x) => s + tasks.filter((t) => t.sprint_id === x.id).length, 0);
  const avgCompletion = totalSprints > 0 ? finishedSprints.reduce((s, x) => s + (x.completion_rate ?? 0), 0) / totalSprints : 0;

  // Velocity chart data
  const velocityData = finishedSprints.map((s) => {
    const m = calculateSprintMetrics(s, tasks);
    return {
      name: s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name,
      Completed: m.completedPoints,
      "Carry-over": m.carryOverPoints,
      Cancelled: m.taskCount.cancelled,
    };
  });

  // Burndown for selected sprint
  const selected = sprints.find((s) => s.id === selectedId) ?? null;
  const burndown = useMemo(() => {
    if (!selected) return [];
    const start = new Date(selected.start_date);
    const end = new Date(selected.end_date);
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const sprintTasks = tasks.filter((t) => t.sprint_id === selected.id);
    const totalPoints = sprintTasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
    const data: { day: string; ideal: number; actual: number }[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const ideal = Math.max(0, Number((totalPoints * (1 - i / totalDays)).toFixed(1)));
      const completedByDay = totalPoints; // không có ngày done thực tế → giả lập tuyến tính theo % completed
      const ratio = (selected.completion_rate ?? 0) / 100;
      const actual = Math.max(0, totalPoints - completedByDay * ratio * (i / totalDays));
      data.push({
        day: `${d.getDate()}/${d.getMonth() + 1}`,
        ideal,
        actual: Number(actual.toFixed(1)),
      });
    }
    return data;
  }, [selected, tasks]);

  // Insights
  const insights: string[] = [];
  if (selected && selected.status === "completed") {
    if ((selected.velocity ?? 0) < avgVelocity * 0.7) {
      insights.push(`⚠️ Velocity của ${selected.name} (${selected.velocity ?? 0} pts) thấp hơn trung bình ${avgVelocity.toFixed(1)} pts`);
    } else if ((selected.velocity ?? 0) > avgVelocity * 1.2) {
      insights.push(`🎯 Velocity của ${selected.name} vượt trung bình ${(((selected.velocity ?? 0) / Math.max(1, avgVelocity) - 1) * 100).toFixed(0)}%`);
    }
    if ((selected.completion_rate ?? 0) < 50) {
      insights.push(`🔴 Completion rate thấp (${selected.completion_rate}%) — xem lại scoping/capacity`);
    }
    if ((selected.carry_over_points ?? 0) > (selected.completed_points ?? 0)) {
      insights.push(`📦 Carry-over (${selected.carry_over_points} pts) > Done (${selected.completed_points} pts) — nhiều task chưa xong`);
    }
  }
  if (insights.length === 0) insights.push("✨ Không có cảnh báo nổi bật cho sprint đã chọn.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">📊 Sprint Analytics</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {/* Select sprint */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Chọn Sprint</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.start_date} → {s.end_date})</option>
              ))}
            </select>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl p-3 bg-slate-50 border border-slate-200 text-center">
              <div className="text-2xl font-bold text-slate-800">{totalSprints}</div>
              <div className="text-xs text-slate-500">Total Sprints (done)</div>
            </div>
            <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-2xl font-bold text-emerald-700">{avgVelocity.toFixed(1)}</div>
              <div className="text-xs text-slate-500">Avg Velocity</div>
            </div>
            <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-700">{totalTasks}</div>
              <div className="text-xs text-slate-500">Total Tasks</div>
            </div>
            <div className="rounded-xl p-3 bg-cyan-50 border border-cyan-200 text-center">
              <div className="text-2xl font-bold text-cyan-700">{avgCompletion.toFixed(1)}%</div>
              <div className="text-xs text-slate-500">Avg Completion</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Burndown */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-700 mb-2">📉 Burndown — {selected?.name ?? "—"}</div>
              {burndown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={burndown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="4 4" name="Ideal" dot={false} />
                    <Line type="monotone" dataKey="actual" stroke="#6366f1" name="Actual" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 py-8 text-center">Chưa đủ dữ liệu</div>
              )}
              <div className="text-[11px] text-slate-500 mt-1">
                Ideal: tuyến tính từ capacity → 0. Actual: ước lượng từ completion rate.
              </div>
            </div>

            {/* Velocity */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-700 mb-2">📊 Velocity Chart</div>
              {velocityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Completed" stackId="a" fill="#10b981" />
                    <Bar dataKey="Carry-over" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Cancelled" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 py-8 text-center">Chưa có sprint hoàn thành</div>
              )}
            </div>
          </div>

          {/* Comparison table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 text-sm font-semibold text-slate-700">📋 Sprint Comparison</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-3 py-2">Sprint</th>
                    <th className="text-right px-3 py-2">Planned</th>
                    <th className="text-right px-3 py-2 bg-emerald-50">Completed</th>
                    <th className="text-right px-3 py-2 bg-amber-50">Carry</th>
                    <th className="text-right px-3 py-2 bg-red-50">Cancel</th>
                    <th className="text-right px-3 py-2">Velocity</th>
                    <th className="text-right px-3 py-2">% Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {sprints.map((s) => {
                    const m = calculateSprintMetrics(s, tasks);
                    return (
                      <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{s.name}</td>
                        <td className="text-right px-3 py-2">{m.plannedPoints}</td>
                        <td className="text-right px-3 py-2 bg-emerald-50/40">{m.completedPoints}</td>
                        <td className="text-right px-3 py-2 bg-amber-50/40">{m.carryOverPoints}</td>
                        <td className="text-right px-3 py-2 bg-red-50/40">{m.taskCount.cancelled}</td>
                        <td className="text-right px-3 py-2 font-medium">{m.velocity}</td>
                        <td className={`text-right px-3 py-2 font-medium ${m.completionRate >= 80 ? "text-emerald-600" : m.completionRate >= 50 ? "text-amber-600" : "text-red-500"}`}>
                          {m.completionRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-xl p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="text-sm font-semibold mb-2">💡 Insights tự động</div>
            <ul className="space-y-1 text-xs">
              {insights.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Đóng</button>
        </div>
      </div>
    </div>
  );
}
