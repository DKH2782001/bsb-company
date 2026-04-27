"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Task, Employee, Kpi, Department, TaskResult } from "@/types/domain";
import { updateTaskAction, updateTaskStatusAction, addTaskResultAction, deleteTaskResultAction } from "@/app/(app)/workspace/actions";
import {
  X,
  Save,
  Calendar,
  AlertTriangle,
  Clock,
  User,
  Tag,
  Target,
  FileText,
  Zap,
  Timer,
} from "lucide-react";

type Props = {
  task: Task;
  employees: Employee[];
  kpis: Kpi[];
  departments: Department[];
  results?: TaskResult[];
  onClose: () => void;
};

const STATUS_OPTIONS = [
  { value: "todo", label: "To do", color: "bg-zinc-100 text-zinc-700" },
  { value: "in_progress", label: "Đang làm", color: "bg-indigo-100 text-indigo-700" },
  { value: "review", label: "Review", color: "bg-violet-100 text-violet-700" },
  { value: "blocked", label: "Blocked", color: "bg-red-100 text-red-700" },
  { value: "done", label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled", label: "Hủy bỏ", color: "bg-zinc-200 text-zinc-500" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", emoji: "🟢" },
  { value: "normal", label: "Normal", emoji: "🟡" },
  { value: "high", label: "High", emoji: "🟠" },
  { value: "urgent", label: "Urgent", emoji: "🔴" },
];

const TYPE_OPTIONS = [
  { value: "growth", label: "Growth", emoji: "🚀" },
  { value: "maintenance", label: "Maintenance", emoji: "🔧" },
  { value: "admin", label: "Admin", emoji: "📋" },
  { value: "urgent", label: "Urgent", emoji: "⚡" },
];

export function TaskDetailModal({ task, employees, kpis, departments, results = [], onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [now] = useState(() => Date.now());
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Local editable state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [taskType, setTaskType] = useState(task.task_type);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
  const [departmentId, setDepartmentId] = useState(task.department_id ?? "");
  const [linkedKpiId, setLinkedKpiId] = useState(task.linked_kpi_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours?.toString() ?? "");
  const [actualHours, setActualHours] = useState(task.actual_hours?.toString() ?? "");

  // Overdue calc
  const isOverdue =
    dueDate && status !== "done" && status !== "cancelled" && new Date(dueDate).getTime() < now;
  const daysOverdue = isOverdue
    ? Math.ceil((now - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Assignee lookup
  const assignee = employees.find((e) => e.id === assigneeId);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", task.id);
      fd.set("title", title);
      fd.set("description", description);
      fd.set("status", status);
      fd.set("priority", priority);
      fd.set("taskType", taskType);
      fd.set("assigneeId", assigneeId);
      fd.set("departmentId", departmentId);
      fd.set("linkedKpiId", linkedKpiId);
      fd.set("dueDate", dueDate);
      if (estimatedHours) fd.set("estimatedHours", estimatedHours);
      if (actualHours) fd.set("actualHours", actualHours);
      await updateTaskAction(fd);
      router.refresh();
      onClose();
    });
  }

  function handleReviewDecision(approve: boolean) {
    const next = approve ? "done" : "in_progress";
    setStatus(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("taskId", task.id);
      fd.set("status", next);
      await updateTaskStatusAction(fd);
      router.refresh();
      onClose();
    });
  }

  const selectClass =
    "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full";

  const labelClass = "flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 pt-5 pb-3 border-b border-zinc-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                className="text-lg font-bold text-zinc-900 bg-transparent border-none outline-none w-full placeholder:text-zinc-300 focus:ring-0"
                placeholder="Tên task"
              />
              {isOverdue && (
                <div className="flex items-center gap-1 mt-1 text-red-600 text-xs font-semibold animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Quá hạn {daysOverdue} ngày!
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => { setStatus(s.value as Task["status"]); markDirty(); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  status === s.value
                    ? `${s.color} ring-2 ring-offset-1 ring-indigo-300`
                    : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-5">
          {/* Review approval banner */}
          {status === "review" && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">👀</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-violet-800">Task đang chờ duyệt</div>
                  <div className="text-xs text-violet-600 mt-0.5">
                    Nhân sự đã nộp kết quả ({results.length} mục). Lead xem lại và phê duyệt.
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReviewDecision(true)}
                      disabled={isPending}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
                    >
                      ✅ Duyệt → Hoàn thành
                    </button>
                    <button
                      onClick={() => handleReviewDecision(false)}
                      disabled={isPending}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-white border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      ↩️ Không duyệt → Đang làm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelClass}>
              <FileText className="h-3 w-3" /> Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
              placeholder="Thêm mô tả task..."
            />
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className={labelClass}>
                <Zap className="h-3 w-3" /> Ưu tiên
              </label>
              <div className="flex gap-1">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => { setPriority(p.value as Task["priority"]); markDirty(); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      priority === p.value
                        ? "bg-indigo-50 border-2 border-indigo-400 text-indigo-700"
                        : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task type */}
            <div>
              <label className={labelClass}>
                <Tag className="h-3 w-3" /> Loại công việc
              </label>
              <div className="flex gap-1">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setTaskType(t.value as Task["task_type"]); markDirty(); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      taskType === t.value
                        ? "bg-indigo-50 border-2 border-indigo-400 text-indigo-700"
                        : "bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className={labelClass}>
                <User className="h-3 w-3" /> Người phụ trách
              </label>
              <select
                value={assigneeId}
                onChange={(e) => { setAssigneeId(e.target.value); markDirty(); }}
                className={selectClass}
              >
                <option value="">— Chưa giao —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className={labelClass}>
                <Tag className="h-3 w-3" /> Phòng ban
              </label>
              <select
                value={departmentId}
                onChange={(e) => { setDepartmentId(e.target.value); markDirty(); }}
                className={selectClass}
              >
                <option value="">— Không chọn —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* KPI */}
            <div>
              <label className={labelClass}>
                <Target className="h-3 w-3" /> Linked KPI
              </label>
              <select
                value={linkedKpiId}
                onChange={(e) => { setLinkedKpiId(e.target.value); markDirty(); }}
                className={selectClass}
              >
                <option value="">— Không gắn KPI —</option>
                {kpis.map((k) => (
                  <option key={k.id} value={k.id}>{k.code ?? k.name}</option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className={labelClass}>
                <Calendar className="h-3 w-3" /> Hạn chót
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); markDirty(); }}
                className={`h-9 text-sm ${isOverdue ? "border-red-400 text-red-600" : ""}`}
              />
            </div>

            {/* Estimated hours */}
            <div>
              <label className={labelClass}>
                <Timer className="h-3 w-3" /> Ước lượng (giờ)
              </label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => { setEstimatedHours(e.target.value); markDirty(); }}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>

            {/* Actual hours */}
            <div>
              <label className={labelClass}>
                <Clock className="h-3 w-3" /> Thực tế (giờ)
              </label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={actualHours}
                onChange={(e) => { setActualHours(e.target.value); markDirty(); }}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Hours progress bar */}
          {(estimatedHours || actualHours) && (
            <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                <span>Tiến độ thời gian</span>
                <span className="font-semibold">
                  {actualHours || 0}h / {estimatedHours || "?"}h
                </span>
              </div>
              {estimatedHours && Number(estimatedHours) > 0 && (
                <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      Number(actualHours || 0) > Number(estimatedHours)
                        ? "bg-red-500"
                        : Number(actualHours || 0) > Number(estimatedHours) * 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (Number(actualHours || 0) / Number(estimatedHours)) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Task Results */}
          <TaskResultsSection
            taskId={task.id}
            results={results}
            onResultSubmitted={() => {
              setStatus((current) =>
                current === "todo" || current === "in_progress" || current === "blocked"
                  ? "review"
                  : current,
              );
            }}
          />

          {/* Meta info */}
          <div className="flex items-center gap-3 text-[10px] text-zinc-400">
            <span>Task ID: {task.id.slice(0, 8)}…</span>
            {assignee && <span>Assignee: {assignee.full_name}</span>}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-zinc-100 px-6 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            {dirty ? "Hủy thay đổi" : "Đóng"}
          </button>
          <Button
            onClick={handleSave}
            disabled={!dirty || isPending}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TaskResultsSection({
  taskId,
  results,
  onResultSubmitted,
}: {
  taskId: string;
  results: TaskResult[];
  onResultSubmitted?: () => void;
}) {
  const router = useRouter();
  const [pending, startTr] = useTransition();
  const [mode, setMode] = useState<"link" | "file">("link");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setUrl(""); setLabel(""); setNote(""); setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (!label) setLabel(f.name);
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(f);
  }

  function handleAdd() {
    if (!url) return;
    startTr(async () => {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("type", mode);
      fd.set("url", url);
      fd.set("label", label || (mode === "link" ? "Link kết quả" : fileName || "File kết quả"));
      fd.set("note", note);
      await addTaskResultAction(fd);
      onResultSubmitted?.();
      router.refresh();
      reset();
    });
  }

  function handleDelete(id: string) {
    startTr(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteTaskResultAction(fd);
      router.refresh();
    });
  }

  return (
    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-xs font-semibold text-zinc-700 uppercase">Kết quả ({results.length})</span>
      </div>

      {/* List existing */}
      {results.length > 0 && (
        <ul className="space-y-1.5">
          {results.map((r) => (
            <li key={r.id} className="flex items-start gap-2 bg-white border border-zinc-200 rounded-lg px-2.5 py-2">
              <span className="text-base">{r.type === "link" ? "🔗" : "📎"}</span>
              <div className="flex-1 min-w-0">
                <a href={r.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline truncate block">
                  {r.label || (r.type === "link" ? r.url : "File")}
                </a>
                {r.note && <div className="text-[10px] text-zinc-500 mt-0.5">{r.note}</div>}
                <div className="text-[10px] text-zinc-400">{new Date(r.created_at).toLocaleString("vi-VN")}</div>
              </div>
              <button onClick={() => handleDelete(r.id)} disabled={pending} className="text-zinc-400 hover:text-red-500 text-xs">×</button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new */}
      <div className="border-t border-zinc-200 pt-3 space-y-2">
        <div className="flex gap-1">
          <button onClick={() => setMode("link")} className={`px-2.5 py-1 rounded-md text-xs font-medium ${mode === "link" ? "bg-indigo-600 text-white" : "bg-white border border-zinc-200 text-zinc-600"}`}>🔗 Link</button>
          <button onClick={() => setMode("file")} className={`px-2.5 py-1 rounded-md text-xs font-medium ${mode === "file" ? "bg-indigo-600 text-white" : "bg-white border border-zinc-200 text-zinc-600"}`}>📎 File</button>
        </div>

        {mode === "link" ? (
          <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 text-sm" />
        ) : (
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFile}
            className="block w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs hover:file:bg-indigo-100"
          />
        )}

        <Input placeholder="Nhãn (tuỳ chọn)" value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 text-sm" />
        <Input placeholder="Ghi chú (tuỳ chọn)" value={note} onChange={(e) => setNote(e.target.value)} className="h-9 text-sm" />

        <Button onClick={handleAdd} disabled={!url || pending} className="w-full h-8 text-xs">
          {pending ? "Đang lưu..." : "+ Thêm kết quả"}
        </Button>
        {mode === "file" && (
          <div className="text-[10px] text-zinc-400">
            File được lưu inline (data URL) trong demo. Production cần Supabase Storage.
          </div>
        )}
      </div>
    </div>
  );
}
