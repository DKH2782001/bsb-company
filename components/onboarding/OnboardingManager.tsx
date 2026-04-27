"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ClipboardList, PlayCircle, Plus, SkipForward } from "lucide-react";
import { useAppContext } from "@/components/layout/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Select } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useToast } from "@/components/ui/toast";
import {
  createOnboardingRunAction,
  updateOnboardingTaskAction,
} from "@/app/(app)/people/onboarding/actions";
import { formatDateVN } from "@/lib/utils";
import type {
  Employee,
  OnboardingRun,
  OnboardingRunTask,
  OnboardingTemplate,
} from "@/types/domain";

type TemplateRow = OnboardingTemplate & {
  task_count: number;
};

type RunRow = OnboardingRun & {
  employee_name: string;
  template_name: string;
};

type TaskRow = OnboardingRunTask & {
  owner_name: string;
};

function runBadge(status: RunRow["status"]) {
  switch (status) {
    case "completed":
      return { label: "Hoàn tất", variant: "success" as const };
    case "in_progress":
      return { label: "Đang chạy", variant: "info" as const };
    case "cancelled":
      return { label: "Đã huỷ", variant: "outline" as const };
    default:
      return { label: "Chưa bắt đầu", variant: "warning" as const };
  }
}

function taskBadge(status: TaskRow["status"]) {
  switch (status) {
    case "completed":
      return { label: "Done", variant: "success" as const };
    case "in_progress":
      return { label: "Doing", variant: "info" as const };
    case "skipped":
      return { label: "Skip", variant: "outline" as const };
    case "overdue":
      return { label: "Overdue", variant: "danger" as const };
    default:
      return { label: "Pending", variant: "warning" as const };
  }
}

export function OnboardingManager({
  templates,
  runs,
  tasks,
  employees,
  viewerEmployeeId,
}: {
  templates: TemplateRow[];
  runs: RunRow[];
  tasks: TaskRow[];
  employees: Employee[];
  viewerEmployeeId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { roles } = useAppContext();
  const canManage = roles.some((role) => role === "ceo" || role === "hr_admin" || role === "dept_head");

  const [selectedRunId, setSelectedRunId] = React.useState<string>(runs[0]?.id ?? "");
  const [creatingRun, setCreatingRun] = React.useState(false);

  React.useEffect(() => {
    if (!runs.length) {
      setSelectedRunId("");
      return;
    }
    if (!selectedRunId || !runs.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs, selectedRunId]);

  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null;
  const selectedTasks = tasks.filter((task) => task.run_id === selectedRunId);

  const runColumns: Column<RunRow>[] = [
    {
      key: "employee",
      header: "Nhân sự",
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900">{row.employee_name}</div>
          <div className="text-xs text-zinc-500">{row.template_name}</div>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Luồng",
      render: (row) => <Badge variant={row.kind === "onboarding" ? "info" : "outline"}>{row.kind}</Badge>,
    },
    {
      key: "timeline",
      header: "Mốc",
      render: (row) => (
        <div>
          <div>{formatDateVN(row.started_on)}</div>
          <div className="text-xs text-zinc-500">{row.target_done_on ? `→ ${formatDateVN(row.target_done_on)}` : "Không đặt hạn"}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "right",
      render: (row) => {
        const badge = runBadge(row.status);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <Button type="button" variant={selectedRunId === row.id ? "default" : "outline"} size="sm" onClick={() => setSelectedRunId(row.id)}>
          Xem task
        </Button>
      ),
    },
  ];

  const taskColumns: Column<TaskRow>[] = [
    {
      key: "title",
      header: "Task",
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900">{row.title}</div>
          <div className="text-xs text-zinc-500">{row.description ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) => row.owner_name,
    },
    {
      key: "due",
      header: "Deadline",
      render: (row) => (row.due_on ? formatDateVN(row.due_on) : "—"),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => {
        const badge = taskBadge(row.status);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <TaskActions
          task={row}
          canManage={canManage}
          isOwner={Boolean(row.owner_employee_id && row.owner_employee_id === viewerEmployeeId)}
          onUpdated={() => router.refresh()}
        />
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Checklist đang chạy</CardTitle>
                <div className="mt-1 text-xs text-zinc-500">
                  Tạo run từ template có sẵn, giao owner và theo dõi tiến độ từng bước.
                </div>
              </div>
              {canManage ? (
                <Button type="button" size="sm" onClick={() => setCreatingRun(true)}>
                  <Plus className="h-4 w-4" />
                  Tạo checklist
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <DataTable columns={runColumns} rows={runs} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Templates hiện có</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-sm text-zinc-500">Chưa có template nào.</div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="rounded-2xl border border-zinc-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-zinc-900">{template.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">{template.description ?? "Không có mô tả."}</div>
                      </div>
                      <Badge variant={template.kind === "onboarding" ? "info" : "outline"}>{template.kind}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">{template.task_count} task mẫu</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {selectedRun ? `Chi tiết checklist · ${selectedRun.employee_name}` : "Chi tiết checklist"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRun ? (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <MiniStat label="Luồng" value={selectedRun.kind} />
                  <MiniStat label="Trạng thái" value={runBadge(selectedRun.status).label} />
                  <MiniStat label="Bắt đầu" value={formatDateVN(selectedRun.started_on)} />
                  <MiniStat label="Mục tiêu xong" value={selectedRun.target_done_on ? formatDateVN(selectedRun.target_done_on) : "—"} />
                </div>
                <DataTable columns={taskColumns} rows={selectedTasks} empty="Checklist này chưa có task." />
              </>
            ) : (
              <div className="text-sm text-zinc-500">Chọn một run để xem task chi tiết.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateRunDialog
        open={creatingRun}
        onClose={() => setCreatingRun(false)}
        templates={templates}
        employees={employees}
        onSaved={() => router.refresh()}
      />
    </>
  );
}

function TaskActions({
  task,
  canManage,
  isOwner,
  onUpdated,
}: {
  task: TaskRow;
  canManage: boolean;
  isOwner: boolean;
  onUpdated?: () => void;
}) {
  const { toast } = useToast();
  const allowed = canManage || isOwner;

  async function update(status: "pending" | "in_progress" | "completed" | "skipped" | "overdue") {
    const res = await updateOnboardingTaskAction({ taskId: task.id, status });
    if (!res.ok) {
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Đã cập nhật task", description: task.title });
    onUpdated?.();
  }

  if (!allowed) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => update("in_progress")}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        title="Đang làm"
      >
        <PlayCircle className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => update("completed")}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600"
        title="Hoàn tất"
      >
        <CheckCheck className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => update("skipped")}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-amber-50 hover:text-amber-600"
        title="Bỏ qua"
      >
        <SkipForward className="h-4 w-4" />
      </button>
    </div>
  );
}

function CreateRunDialog({
  open,
  onClose,
  templates,
  employees,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  templates: TemplateRow[];
  employees: Employee[];
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    templateId: "",
    employeeId: "",
    kind: "onboarding",
    startedOn: "",
    targetDoneOn: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setServerError(null);
    setForm({
      templateId: templates[0]?.id ?? "",
      employeeId: employees[0]?.id ?? "",
      kind: (templates[0]?.kind ?? "onboarding") as "onboarding" | "offboarding",
      startedOn: new Date().toISOString().slice(0, 10),
      targetDoneOn: "",
      notes: "",
    });
  }, [open, templates, employees]);

  async function submit() {
    const res = await createOnboardingRunAction({
      templateId: form.templateId,
      employeeId: form.employeeId,
      kind: form.kind as "onboarding" | "offboarding",
      startedOn: form.startedOn,
      targetDoneOn: form.targetDoneOn || undefined,
      notes: form.notes || undefined,
    });
    if (!res.ok) {
      setServerError(res.error);
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Đã tạo checklist", description: employees.find((employee) => employee.id === form.employeeId)?.full_name ?? "" });
    onSaved?.();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tạo checklist mới"
      description="Tạo onboarding/offboarding run từ template hiện có của công ty."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="button" onClick={submit}>
            Tạo checklist
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Template" required>
          <Select
            value={form.templateId}
            onChange={(event) => {
              const template = templates.find((item) => item.id === event.target.value);
              setForm((prev) => ({
                ...prev,
                templateId: event.target.value,
                kind: (template?.kind ?? prev.kind) as "onboarding" | "offboarding",
              }));
            }}
          >
            <option value="">Chọn template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Luồng">
          <Select value={form.kind} onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value }))}>
            <option value="onboarding">onboarding</option>
            <option value="offboarding">offboarding</option>
          </Select>
        </FormField>
        <FormField label="Nhân sự" required className="sm:col-span-2">
          <Select value={form.employeeId} onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}>
            <option value="">Chọn nhân sự</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ngày bắt đầu" required>
          <Input type="date" value={form.startedOn} onChange={(event) => setForm((prev) => ({ ...prev, startedOn: event.target.value }))} />
        </FormField>
        <FormField label="Mục tiêu hoàn tất">
          <Input type="date" value={form.targetDoneOn} onChange={(event) => setForm((prev) => ({ ...prev, targetDoneOn: event.target.value }))} />
        </FormField>
        <FormField label="Ghi chú" className="sm:col-span-2">
          <textarea
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-3 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            placeholder="Ví dụ: cần hoàn tất contract trước ngày onboard..."
          />
        </FormField>
        {serverError ? <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div> : null}
      </div>
    </Dialog>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}
