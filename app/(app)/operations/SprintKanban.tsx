"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import type { Task, Employee } from "@/types/domain";
import { updateTaskStatusAction } from "@/app/(app)/workspace/actions";

type TaskStatus = Task["status"];

const COLUMNS: Array<{ key: TaskStatus; label: string; color: string; header: string }> = [
  { key: "todo",        label: "📋 To do",     color: "bg-zinc-50 border-zinc-200",      header: "bg-zinc-100 text-zinc-700" },
  { key: "in_progress", label: "⚡ Đang làm",   color: "bg-amber-50/50 border-amber-200",  header: "bg-amber-100 text-amber-700" },
  { key: "review",      label: "👀 Review",     color: "bg-violet-50/50 border-violet-200", header: "bg-violet-100 text-violet-700" },
  { key: "blocked",     label: "🚫 Blocked",    color: "bg-red-50/50 border-red-200",      header: "bg-red-100 text-red-700" },
  { key: "done",        label: "✅ Hoàn thành", color: "bg-emerald-50/50 border-emerald-200", header: "bg-emerald-100 text-emerald-700" },
];

export function SprintKanban({ tasks, employees, onOpenDetail }: { tasks: Task[]; employees: Employee[]; onOpenDetail?: (id: string) => void }) {
  const [localStatus, setLocalStatus] = useState<Record<string, TaskStatus>>({});
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [, startTransition] = useTransition();
  const draggingId = useRef<string | null>(null);

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

  const resolved = tasks.map((t) => ({ ...t, status: localStatus[t.id] ?? t.status }));

  function onDragStart(e: React.DragEvent, id: string) {
    draggingId.current = id;
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.4";
  }
  function onDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    draggingId.current = null;
    setDragOver(null);
  }
  function onDrop(e: React.DragEvent, col: TaskStatus) {
    e.preventDefault();
    setDragOver(null);
    const id = draggingId.current;
    if (!id) return;
    const cur = tasks.find((t) => t.id === id);
    if (!cur || (localStatus[id] ?? cur.status) === col) return;
    setLocalStatus((p) => ({ ...p, [id]: col }));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", id);
      fd.set("status", col);
      await updateTaskStatusAction(fd);
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {COLUMNS.map((c) => {
        const colTasks = resolved.filter((t) => t.status === c.key);
        const over = dragOver === c.key;
        return (
          <div
            key={c.key}
            onDragOver={(e) => { e.preventDefault(); setDragOver(c.key); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDrop(e, c.key)}
            className={`rounded-xl border p-2.5 min-h-[320px] transition-all ${c.color} ${over ? "ring-2 ring-indigo-400 border-dashed" : ""}`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.header}`}>{c.label}</span>
              <span className="text-[10px] text-slate-500">{colTasks.length}</span>
            </div>
            <div className="space-y-1.5">
              {colTasks.map((t) => {
                const emp = employees.find((e) => e.id === t.assignee_id);
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, t.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => onOpenDetail?.(t.id)}
                    className="rounded-lg bg-white border border-slate-200 p-2 text-xs shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all active:cursor-grabbing"
                  >
                    <div className={`font-semibold leading-snug mb-1 ${t.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {t.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{t.story_points ? `${t.story_points} pts` : ""}</span>
                      {emp && <span className="truncate max-w-[100px]">👤 {emp.full_name}</span>}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div className={`flex items-center justify-center h-16 rounded-lg border-2 border-dashed text-[11px] ${over ? "border-indigo-400 text-indigo-400" : "border-slate-200 text-slate-300"}`}>
                  {over ? "Thả vào đây" : "—"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
