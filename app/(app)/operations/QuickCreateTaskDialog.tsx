"use client";

import { useState, useTransition } from "react";
import { X, Plus, AlertTriangle } from "lucide-react";
import { createTaskAction } from "@/app/(app)/workspace/actions";
import type { Employee } from "@/types/domain";

type Priority = "low" | "normal" | "high" | "urgent";
type TaskType = "growth" | "maintenance" | "admin" | "urgent";

export function QuickCreateTaskDialog({
  sprintId,
  sprintName,
  employees,
  onClose,
  defaults,
}: {
  sprintId: string | null;
  sprintName?: string;
  employees: Employee[];
  onClose: () => void;
  defaults?: { priority?: Priority; taskType?: TaskType; urgent?: boolean };
}) {
  const isUrgent = defaults?.urgent === true;

  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>(defaults?.priority ?? "normal");
  const [taskType, setTaskType] = useState<TaskType>(defaults?.taskType ?? "growth");
  const [storyPoints, setStoryPoints] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Tiêu đề task không được để trống.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", title.trim());
      if (assigneeId) fd.set("assigneeId", assigneeId);
      if (dueDate) fd.set("dueDate", dueDate);
      fd.set("priority", priority);
      fd.set("taskType", taskType);
      if (sprintId) fd.set("sprintId", sprintId);
      if (storyPoints) fd.set("storyPoints", storyPoints);
      await createTaskAction(fd);
      onClose();
    });
  }

  const headerColor = isUrgent ? "from-red-500 to-rose-600" : "from-indigo-500 to-purple-600";
  const headerIcon = isUrgent ? <AlertTriangle className="h-5 w-5" /> : <Plus className="h-5 w-5" />;
  const title_label = isUrgent ? "⚠️ Tạo task khẩn cấp" : "Tạo task mới";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={`flex items-center justify-between px-5 py-4 bg-gradient-to-r ${headerColor} text-white rounded-t-2xl`}>
          <div className="flex items-center gap-2 font-semibold">
            {headerIcon}
            {title_label}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {sprintName && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-700">
              Task sẽ được gắn vào sprint: <span className="font-semibold">{sprintName}</span>
            </div>
          )}

          <Field label="Tiêu đề *">
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vd: Fix bug login, viết JD vị trí Sales..."
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Người thực hiện">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">— Chưa gán —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </Field>

            <Field label="Hạn chót">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Ưu tiên">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>

            <Field label="Loại">
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="growth">Growth</option>
                <option value="maintenance">Maintenance</option>
                <option value="admin">Admin</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>

            <Field label="Story Points">
              <input
                type="number"
                min={0}
                step={1}
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="—"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-md bg-gradient-to-r ${headerColor}`}
            >
              {isPending ? "Đang tạo..." : isUrgent ? "Tạo task khẩn cấp" : "Tạo task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
