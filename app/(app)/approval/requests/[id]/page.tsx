import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  UserRoundCheck,
  Users,
  XCircle,
} from "lucide-react";

import {
  addApprovalStepAction,
  approveRequestAction,
  commentApprovalAction,
  delegateApprovalAction,
  reassignApprovalAction,
  rejectRequestAction,
  returnApprovalAction,
} from "@/app/(app)/governance/actions";
import { ApprovalAttachmentPreview } from "@/components/approvals/ApprovalAttachmentPreview";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getApprovalProgress,
  getApprovalWorkflow,
  getCurrentApprovalStep,
  type ApprovalWorkflowStep,
} from "@/lib/approvals/workflow";
import { fetchApprovals, fetchEmployees } from "@/lib/queries";
import { getAuthenticatedUser, getUserContext } from "@/lib/repositories/shared";
import type { Approval, Employee } from "@/types/domain";

const kindLabel: Record<string, string> = {
  payroll_adjustment: "Dieu chinh payroll",
  job_requisition: "Tuyen dung",
  kpi_change: "Thay doi KPI",
  project_budget: "Budget du an",
};

const kindTone: Record<string, "info" | "success" | "warning" | "outline"> = {
  payroll_adjustment: "warning",
  job_requisition: "info",
  kpi_change: "outline",
  project_budget: "success",
};

const statusLabel: Record<Approval["status"], string> = {
  pending: "Cho duyet",
  approved: "Da duyet",
  rejected: "Tu choi",
  cancelled: "Da huy",
};

function statusTone(status: Approval["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "cancelled") return "outline";
  return "warning";
}

function stepTone(status: ApprovalWorkflowStep["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "cancelled") return "outline";
  return "warning";
}

function employeeName(employees: Employee[], employeeId?: string | null) {
  if (!employeeId) return "Chua gan";
  return employees.find((employee) => employee.id === employeeId)?.full_name ?? employeeId;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
}

function formatPayloadValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Chua nhap";
  if (Array.isArray(value)) return value.map(formatPayloadValue).join(", ");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.kind === "file") {
      const size = typeof record.size === "number" ? ` (${Math.round(record.size / 1024)}KB)` : "";
      return `${String(record.name ?? "file")}${size}`;
    }
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function getApprovalFormRows(approval: Approval) {
  const formData = approval.payload.formData;
  if (Array.isArray(formData)) {
    return formData.map((item, index) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        id: String(row.fieldId ?? `field_${index}`),
        label: String(row.label ?? row.fieldId ?? `Truong ${index + 1}`),
        rawValue: row.value,
        value: formatPayloadValue(row.value),
      };
    });
  }

  return Object.entries(approval.payload)
    .filter(([key]) => !["approvalWorkflow", "formData"].includes(key))
    .map(([key, value]) => ({
      id: key,
      label: key,
      rawValue: value,
      value: formatPayloadValue(value),
    }));
}

function filePreviewItems(value: unknown): Array<{ name: string; type: string; dataUrl?: string }> {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (record.kind !== "file") return [];
    return [
      {
        name: String(record.name ?? "file"),
        type: String(record.type ?? ""),
        dataUrl: typeof record.dataUrl === "string" ? record.dataUrl : undefined,
      },
    ];
  });
}

function RequestInfo({
  approval,
  employees,
}: {
  approval: Approval;
  employees: Employee[];
}) {
  const requester = employees.find((employee) => employee.id === approval.requested_by);
  const currentStep = getCurrentApprovalStep(approval);
  const progress = getApprovalProgress(approval);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Thong tin request</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
          <div className="text-xs text-[var(--text-soft)]">Loai phieu</div>
          <div className="mt-1 font-semibold text-[var(--text-strong)]">{kindLabel[approval.kind] ?? approval.kind}</div>
        </div>
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
          <div className="text-xs text-[var(--text-soft)]">Nguoi gui</div>
          <div className="mt-1 font-semibold text-[var(--text-strong)]">{requester?.full_name ?? "Khong ro"}</div>
        </div>
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
          <div className="text-xs text-[var(--text-soft)]">Buoc hien tai</div>
          <div className="mt-1 font-semibold text-[var(--text-strong)]">{currentStep?.label ?? "Da ket thuc"}</div>
        </div>
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
          <div className="text-xs text-[var(--text-soft)]">Tien do</div>
          <div className="mt-1 font-semibold text-[var(--text-strong)]">
            {progress.approved}/{progress.total} buoc · {progress.percent}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestContent({ approval }: { approval: Approval }) {
  const rows = getApprovalFormRows(approval);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Noi dung phieu de xuat
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line-soft)] p-8 text-center text-sm text-[var(--text-soft)]">
            Request cu chua co du lieu form chi tiet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">
                  {row.label}
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--text-strong)]">
                  {row.value}
                </div>
                <ApprovalAttachmentPreview files={filePreviewItems(row.rawValue)} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CurrentRouteCard({
  approval,
  employees,
}: {
  approval: Approval;
  employees: Employee[];
}) {
  const workflow = getApprovalWorkflow(approval);
  const currentStep = getCurrentApprovalStep(approval);
  const progress = getApprovalProgress(approval);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4" />
          Routing hien tai
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
          <div>
            <div className="text-sm font-semibold text-[var(--text-strong)]">
              {currentStep
                ? `${currentStep.label} - ${employeeName(employees, currentStep.approverEmployeeId)}`
                : "Da ket thuc workflow"}
            </div>
            <div className="mt-1 text-xs text-[var(--text-soft)]">{workflow.routingRule}</div>
          </div>
          <Badge variant={approval.status === "pending" ? "warning" : statusTone(approval.status)}>
            {progress.approved}/{progress.total} buoc
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function StepTimeline({
  approval,
  employees,
}: {
  approval: Approval;
  employees: Employee[];
}) {
  const workflow = getApprovalWorkflow(approval);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Timeline quy trinh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {workflow.steps.map((step) => (
          <div
            key={step.id}
            className="grid gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] p-3 md:grid-cols-[36px_1fr_auto]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-xs font-bold text-[var(--text-strong)]">
              {step.sort}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-[var(--text-strong)]">{step.label}</div>
                <Badge variant={stepTone(step.status)}>{step.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-[var(--text-soft)]">
                Nguoi duyet: {employeeName(employees, step.approverEmployeeId)} · Role: {step.approverRole}
                {step.delegatedFromEmployeeId ? ` · Uy quyen tu ${employeeName(employees, step.delegatedFromEmployeeId)}` : ""}
              </div>
              {step.comment && (
                <div className="mt-2 rounded-xl bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text-soft)]">
                  Ghi chu: {step.comment}
                </div>
              )}
            </div>
            <div className="text-right text-xs text-[var(--text-soft)]">
              {step.actedAt ? formatDate(step.actedAt) : "Dang cho"}
            </div>
          </div>
        ))}
        {(workflow.comments ?? []).length > 0 && (
          <div className="mt-4 space-y-2 border-t border-[var(--line-soft)] pt-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">
              Binh luan / thao tac bo sung
            </div>
            {(workflow.comments ?? []).map((comment, index) => (
              <div key={`${comment.at}-${index}`} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3 text-sm">
                <div className="text-xs text-[var(--text-soft)]">
                  {employeeName(employees, comment.by)} · {formatDate(comment.at)}
                </div>
                <div className="mt-1 whitespace-pre-wrap text-[var(--text-strong)]">{comment.note}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkflowComments({
  approval,
  employees,
}: {
  approval: Approval;
  employees: Employee[];
}) {
  const workflow = getApprovalWorkflow(approval);
  const comments = workflow.comments ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Binh luan noi bo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={commentApprovalAction} className="space-y-2">
          <input type="hidden" name="approvalId" value={approval.id} />
          <textarea
            name="note"
            required
            placeholder="Nhap binh luan, ghi chu xu ly, yeu cau bo sung..."
            className="min-h-24 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-soft)]/75 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          />
          <Button size="sm" variant="secondary" type="submit" className="w-full">
            Luu binh luan
          </Button>
        </form>

        <div className="space-y-2 border-t border-[var(--line-soft)] pt-3">
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-alt)] p-4 text-center text-sm text-[var(--text-soft)]">
              Chua co binh luan nao cho phieu nay.
            </div>
          ) : (
            comments
              .slice()
              .reverse()
              .map((comment, index) => (
                <div key={`${comment.at}-${index}`} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3 text-sm">
                  <div className="text-xs text-[var(--text-soft)]">
                    {employeeName(employees, comment.by)} · {formatDate(comment.at)}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-[var(--text-strong)]">{comment.note}</div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovalActions({
  approval,
  employees,
  currentEmployeeId,
}: {
  approval: Approval;
  employees: Employee[];
  currentEmployeeId: string | null;
}) {
  const activeEmployees = employees.filter((employee) => employee.status !== "terminated");
  const currentStep = getCurrentApprovalStep(approval);
  const canDecide = !currentStep?.approverEmployeeId || currentStep.approverEmployeeId === currentEmployeeId;

  if (approval.status !== "pending") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Thao tac</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-28 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-4 text-center text-sm text-[var(--text-soft)]">
            Request nay da co quyet dinh. Workflow duoc giu lai de audit.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Thao tac phe duyet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={approveRequestAction} className="space-y-2">
          <input type="hidden" name="approvalId" value={approval.id} />
          <Input name="note" placeholder="Ghi chu khi duyet buoc hien tai..." />
          <Button size="sm" type="submit" className="w-full" disabled={!canDecide}>
            Duyet buoc hien tai
          </Button>
        </form>

        <form action={rejectRequestAction} className="space-y-2">
          <input type="hidden" name="approvalId" value={approval.id} />
          <textarea
            name="note"
            placeholder="Ly do tu choi..."
            className="min-h-20 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-soft)]/75 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          />
          <Button size="sm" variant="outline" type="submit" className="w-full" disabled={!canDecide}>
            Tu choi request
          </Button>
        </form>

        <form action={returnApprovalAction} className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <input type="hidden" name="approvalId" value={approval.id} />
          <Input name="note" placeholder="Ly do tra ve/chinh sua..." className="bg-white" />
          <Button size="sm" variant="outline" type="submit" className="w-full" disabled={!canDecide}>
            Tra ve buoc truoc
          </Button>
        </form>
        {!canDecide && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Ban khong phai nguoi duyet hien tai. Request dang cho {employeeName(employees, currentStep?.approverEmployeeId)} duyet.
          </div>
        )}

        <div className="grid gap-3 border-t border-[var(--line-soft)] pt-3 md:grid-cols-2">
          <form action={reassignApprovalAction} className="space-y-2">
            <input type="hidden" name="approvalId" value={approval.id} />
            <select
              name="toEmployeeId"
              required
              className="h-10 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-strong)]"
            >
              <option value="">Chuyen nguoi duyet...</option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            <Input name="note" placeholder="Ly do chuyen..." className="h-10 text-xs" />
            <Button size="sm" variant="secondary" type="submit" className="w-full">
              Chuyen nguoi duyet
            </Button>
          </form>

          <form action={delegateApprovalAction} className="space-y-2">
            <input type="hidden" name="approvalId" value={approval.id} />
            <select
              name="toEmployeeId"
              required
              className="h-10 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-strong)]"
            >
              <option value="">Uy quyen cho...</option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            <Input name="note" placeholder="Ghi chu uy quyen..." className="h-10 text-xs" />
            <Button size="sm" variant="secondary" type="submit" className="w-full">
              Uy quyen
            </Button>
          </form>
        </div>

        <form action={addApprovalStepAction} className="space-y-2 border-t border-[var(--line-soft)] pt-3">
          <input type="hidden" name="approvalId" value={approval.id} />
          <div className="grid gap-2 md:grid-cols-[1fr_150px]">
            <select
              name="toEmployeeId"
              required
              className="h-10 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-strong)]"
            >
              <option value="">Them nguoi duyet...</option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            <select
              name="position"
              className="h-10 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-strong)]"
              defaultValue="after_current"
            >
              <option value="after_current">Sau buoc nay</option>
              <option value="before_current">Truoc buoc nay</option>
            </select>
          </div>
          <Input name="note" placeholder="Ghi chu khi chen nguoi duyet..." className="h-10 text-xs" />
          <Button size="sm" variant="secondary" type="submit" className="w-full">
            Them nguoi duyet
          </Button>
        </form>

      </CardContent>
    </Card>
  );
}

export default async function ApprovalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [approvals, employees, user] = await Promise.all([fetchApprovals(), fetchEmployees(), getAuthenticatedUser()]);
  const approval = approvals.find((item) => item.id === id);
  if (!approval) notFound();

  const context = await getUserContext(user);
  const currentEmployeeId = context.employeeId ?? "e1";
  const progress = getApprovalProgress(approval);
  const currentStep = getCurrentApprovalStep(approval);

  return (
    <div>
      <PageHeader
        helpKey="/approval/inbox"
        title={approval.title}
        description={`Tao luc ${formatDate(approval.created_at)} · Dang o buoc ${currentStep?.label ?? "ket thuc"}`}
        actions={
          <Link
            href="/approval/inbox"
            className="inline-flex h-9 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 text-xs font-medium text-[var(--text-strong)] hover:bg-[var(--surface-alt)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lai Inbox
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--line-soft)]/90">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-soft)]">
            <Clock className="h-4 w-4 text-amber-500" />
            Trang thai
          </div>
          <div className="mt-2">
            <Badge variant={statusTone(approval.status)}>{statusLabel[approval.status]}</Badge>
          </div>
        </div>
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--line-soft)]/90">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-soft)]">
            <FileText className="h-4 w-4 text-blue-500" />
            Loai
          </div>
          <div className="mt-2">
            <Badge variant={kindTone[approval.kind] ?? "outline"}>{kindLabel[approval.kind] ?? approval.kind}</Badge>
          </div>
        </div>
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--line-soft)]/90">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-soft)]">
            <UserRoundCheck className="h-4 w-4 text-emerald-500" />
            Nguoi duyet
          </div>
          <div className="mt-2 truncate text-lg font-bold text-[var(--text-strong)]">
            {employeeName(employees, currentStep?.approverEmployeeId)}
          </div>
        </div>
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--line-soft)]/90">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-soft)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Tien do
          </div>
          <div className="mt-2 text-lg font-bold text-[var(--text-strong)]">{progress.percent}%</div>
        </div>
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-[var(--shadow-card)] ring-1 ring-[var(--line-soft)]/90">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-soft)]">
            <XCircle className="h-4 w-4 text-red-500" />
            Workflow
          </div>
          <div className="mt-2 text-lg font-bold text-[var(--text-strong)]">
            {progress.approved}/{progress.total}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <RequestInfo approval={approval} employees={employees} />
          <RequestContent approval={approval} />
          <CurrentRouteCard approval={approval} employees={employees} />
          <StepTimeline approval={approval} employees={employees} />
          <details className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--text-strong)]">
              Xem payload ky thuat
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--surface)] p-3 text-xs text-[var(--text-soft)]">
              {JSON.stringify(approval.payload, null, 2)}
            </pre>
          </details>
        </div>

        <div className="space-y-4">
          <ApprovalActions approval={approval} employees={employees} currentEmployeeId={currentEmployeeId} />
          <WorkflowComments approval={approval} employees={employees} />
          {approval.decision_note && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ArrowRightLeft className="h-4 w-4" />
                  Ghi chu quyet dinh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3 text-sm text-[var(--text-soft)]">
                  {approval.decision_note}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Luu y quyen thao tac
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-[var(--text-soft)]">
              Chi nguoi duyet hien tai moi duoc approve/reject. Chuyen nguoi duyet va uy quyen se cap nhat current step,
              ghi audit va tao notification cho nguoi nhan.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
