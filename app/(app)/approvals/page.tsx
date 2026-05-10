import Link from "next/link";
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
  XCircle,
} from "lucide-react";

import {
  approveRequestAction,
  bulkApproveRequestsAction,
  delegateApprovalAction,
  reassignApprovalAction,
  rejectRequestAction,
} from "@/app/(app)/governance/actions";
import { KpiCard } from "@/components/kpi/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import {
  getApprovalProgress,
  getApprovalWorkflow,
  getCurrentApprovalStep,
  type ApprovalWorkflowStep,
} from "@/lib/approvals/workflow";
import { tServer } from "@/lib/i18n/server";
import { fetchApprovals, fetchEmployees } from "@/lib/queries";
import { getAuthenticatedUser, getUserContext } from "@/lib/repositories/shared";
import type { Approval, Employee } from "@/types/domain";

type SearchParams = Record<string, string | string[] | undefined>;

const kindLabel: Record<string, string> = {
  payroll_adjustment: "Điều chỉnh payroll",
  job_requisition: "Tuyển dụng",
  kpi_change: "Thay đổi KPI",
  project_budget: "Budget dự án",
};

const kindTone: Record<string, "info" | "success" | "warning" | "outline"> = {
  payroll_adjustment: "warning",
  job_requisition: "info",
  kpi_change: "outline",
  project_budget: "success",
};

const statusLabel: Record<Approval["status"], string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
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

function textParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function filterApprovals(
  approvals: Approval[],
  filter: { status: string; kind: string; q: string },
) {
  const q = filter.q.trim().toLowerCase();
  return approvals.filter((approval) => {
    const workflow = getApprovalWorkflow(approval);
    const currentStep = getCurrentApprovalStep(approval);
    const matchStatus = !filter.status || filter.status === "all" || approval.status === filter.status;
    const matchKind = !filter.kind || filter.kind === "all" || approval.kind === filter.kind;
    const searchText = [
      approval.title,
      approval.kind,
      workflow.routingRule,
      currentStep?.label ?? "",
      currentStep?.approverRole ?? "",
      JSON.stringify(approval.payload),
    ]
      .join(" ")
      .toLowerCase();
    const matchQ = !q || searchText.includes(q);
    return matchStatus && matchKind && matchQ;
  });
}

function employeeName(employees: Employee[], employeeId?: string | null) {
  if (!employeeId) return "Chưa gán";
  return employees.find((employee) => employee.id === employeeId)?.full_name ?? employeeId;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
}

function formatPayloadValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Chua nhap";
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
        value: formatPayloadValue(row.value),
      };
    });
  }

  return Object.entries(approval.payload)
    .filter(([key]) => !["approvalWorkflow", "formData"].includes(key))
    .map(([key, value]) => ({
      id: key,
      label: key,
      value: formatPayloadValue(value),
    }));
}

function ApprovalRequestDetail({ approval }: { approval: Approval }) {
  const rows = getApprovalFormRows(approval);

  return (
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
        <FileText className="h-4 w-4" />
        Chi tiet phieu de xuat
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line-soft)] bg-[var(--surface)] p-4 text-sm text-[var(--text-soft)]">
          Request cu chua co du lieu form chi tiet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">
                {row.label}
              </div>
              <div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--text-strong)]">
                {row.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">
            Routing hiện tại
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--text-strong)]">
            {currentStep
              ? `${currentStep.label} - ${employeeName(employees, currentStep.approverEmployeeId)}`
              : "Đã kết thúc workflow"}
          </div>
        </div>
        <Badge variant={approval.status === "pending" ? "warning" : statusTone(approval.status)}>
          {progress.approved}/{progress.total} bước
        </Badge>
      </div>
      <div className="rounded-xl bg-[var(--surface)] p-3 text-xs leading-relaxed text-[var(--text-soft)]">
        {workflow.routingRule}
      </div>
    </div>
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
    <div className="space-y-2">
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
              Người duyệt: {employeeName(employees, step.approverEmployeeId)} · Role: {step.approverRole}
              {step.delegatedFromEmployeeId ? ` · Uỷ quyền từ ${employeeName(employees, step.delegatedFromEmployeeId)}` : ""}
            </div>
            {step.comment && (
              <div className="mt-2 rounded-xl bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text-soft)]">
                Ghi chú: {step.comment}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-[var(--text-soft)]">
            {step.actedAt ? formatDate(step.actedAt) : "Đang chờ"}
          </div>
        </div>
      ))}
    </div>
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
      <div className="flex h-full min-h-28 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-4 text-center text-sm text-[var(--text-soft)]">
        Request này đã có quyết định. Workflow được giữ lại để audit.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
      <form action={approveRequestAction} className="space-y-2">
        <input type="hidden" name="approvalId" value={approval.id} />
        <Input name="note" placeholder="Ghi chú khi duyệt bước hiện tại..." />
        <Button size="sm" type="submit" className="w-full" disabled={!canDecide}>
          Duyệt bước hiện tại
        </Button>
      </form>

      <form action={rejectRequestAction} className="space-y-2">
        <input type="hidden" name="approvalId" value={approval.id} />
        <textarea
          name="note"
          placeholder="Lý do từ chối..."
          className="min-h-20 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-soft)]/75 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
        />
        <Button size="sm" variant="outline" type="submit" className="w-full" disabled={!canDecide}>
          Từ chối request
        </Button>
      </form>
      {!canDecide && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Bạn không phải người duyệt hiện tại. Request đang chờ {employeeName(employees, currentStep?.approverEmployeeId)} duyệt.
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
            <option value="">Chuyển người duyệt...</option>
            {activeEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
          <Input name="note" placeholder="Lý do chuyển..." className="h-10 text-xs" />
          <Button size="sm" variant="secondary" type="submit" className="w-full">
            Reassign
          </Button>
        </form>

        <form action={delegateApprovalAction} className="space-y-2">
          <input type="hidden" name="approvalId" value={approval.id} />
          <select
            name="toEmployeeId"
            required
            className="h-10 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-strong)]"
          >
            <option value="">Uỷ quyền cho...</option>
            {activeEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
          <Input name="note" placeholder="Ghi chú uỷ quyền..." className="h-10 text-xs" />
          <Button size="sm" variant="secondary" type="submit" className="w-full">
            Delegate
          </Button>
        </form>
      </div>
    </div>
  );
}

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { t } = await tServer();
  const sp = await searchParams;
  const [approvals, employees, user] = await Promise.all([fetchApprovals(), fetchEmployees(), getAuthenticatedUser()]);
  const context = await getUserContext(user);
  const currentEmployeeId = context.employeeId ?? "e1";

  const filter = {
    status: textParam(sp.status) || "all",
    kind: textParam(sp.kind) || "all",
    q: textParam(sp.q),
    tab: textParam(sp.tab) || "pending",
  };
  const filteredApprovals = filterApprovals(approvals, filter).filter((approval) => {
    if (filter.tab === "pending") return approval.status === "pending";
    if (filter.tab === "approved") return approval.status === "approved";
    if (filter.tab === "mine") return approval.requested_by === currentEmployeeId || approval.requested_by === "e18";
    if (filter.tab === "cc") return false;
    return true;
  });
  const pendingFiltered = filteredApprovals.filter((approval) => approval.status === "pending");

  const pending = approvals.filter((approval) => approval.status === "pending").length;
  const approved = approvals.filter((approval) => approval.status === "approved").length;
  const rejected = approvals.filter((approval) => approval.status === "rejected").length;
  const mine = approvals.filter((approval) => approval.requested_by === currentEmployeeId || approval.requested_by === "e18").length;
  const routed = approvals.filter((approval) => getApprovalWorkflow(approval).steps.length > 1).length;
  const delegated = approvals.filter((approval) =>
    getApprovalWorkflow(approval).steps.some((step) => step.delegatedFromEmployeeId),
  ).length;

  const byKind = Object.entries(
    approvals.reduce<Record<string, number>>((acc, approval) => {
      acc[approval.kind] = (acc[approval.kind] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([kind, count]) => ({ kind, count }));
  const maxKindCount = Math.max(1, ...byKind.map((item) => item.count));
  const uniqueKinds = Array.from(new Set(approvals.map((approval) => approval.kind)));

  return (
    <div>
      <PageHeader
        helpKey="/approval/inbox"
        title={t("approvals.title")}
        description="Trung tam phe duyet: theo doi request can duyet, request da xu ly, CC va request toi da gui."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/approval/admin/createApproval"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-600),#415bff)] px-3.5 text-xs font-medium text-white shadow-[0_12px_24px_rgba(88,72,246,0.22)]"
            >
              Tao quy trinh
            </Link>
            <Link
              href="/approval"
              className="inline-flex h-9 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 text-xs font-medium text-[var(--text-strong)] hover:bg-[var(--surface-alt)]"
            >
              Gui yeu cau
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="Chờ duyệt" value={String(pending)} accent="amber" icon={<Clock className="h-3.5 w-3.5" />} />
        <KpiCard label="Đã duyệt" value={String(approved)} accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <KpiCard label="Từ chối" value={String(rejected)} accent="red" icon={<XCircle className="h-3.5 w-3.5" />} />
        <KpiCard label="Nhieu cap" value={String(routed)} accent="indigo" icon={<GitBranch className="h-3.5 w-3.5" />} />
        <KpiCard label="Uy quyen" value={String(delegated)} accent="cyan" icon={<ArrowRightLeft className="h-3.5 w-3.5" />} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-3xl border border-[var(--line-soft)] bg-[var(--surface)] p-2">
        {[
          { id: "pending", label: "Pending", count: pending },
          { id: "approved", label: "Approved", count: approved },
          { id: "cc", label: "CC", count: 0 },
          { id: "mine", label: "My requests", count: mine },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/approval/inbox?tab=${tab.id}&status=all&kind=${filter.kind}`}
            className={`inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-medium ${
              filter.tab === tab.id
                ? "bg-blue-600 text-white"
                : "text-[var(--text-soft)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-strong)]"
            }`}
          >
            {tab.label}
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{tab.count}</span>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Theo loại yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={byKind.map((item) => ({
                label: kindLabel[item.kind] ?? item.kind,
                value: item.count,
                max: maxKindCount,
                right: `${item.count}`,
                color: "#6366f1",
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nang luc quy trinh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Routing theo rule" value="Dang bat" tone="success" />
            <StatChip label="Duyet nhieu cap" value="Dang bat" tone="success" />
            <StatChip label="Chuyen nguoi duyet" value="Dang bat" tone="success" />
            <StatChip label="Duyet hang loat" value="Dang bat" tone="success" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bulk approve</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={bulkApproveRequestsAction} className="space-y-3">
              {pendingFiltered.map((approval) => (
                <input key={approval.id} type="hidden" name="approvalIds" value={approval.id} />
              ))}
              <Input name="note" placeholder="Ghi chú duyệt hàng loạt..." />
              <Button type="submit" className="w-full" disabled={pendingFiltered.length === 0}>
                Duyệt {pendingFiltered.length} request đang lọc
              </Button>
              <div className="text-xs text-[var(--text-soft)]">
                Bulk approve chỉ duyệt bước hiện tại của mỗi request, không bỏ qua các bước sau.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Yêu cầu phê duyệt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3 md:grid-cols-[1fr_180px_180px_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-soft)]" />
              <Input name="q" defaultValue={filter.q} placeholder="Tìm theo tiêu đề, rule, người duyệt..." className="pl-9" />
            </div>
            <select
              name="status"
              defaultValue={filter.status}
              className="h-11 rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-strong)]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <input type="hidden" name="tab" value={filter.tab} />
            <select
              name="kind"
              defaultValue={filter.kind}
              className="h-11 rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-strong)]"
            >
              <option value="all">Tất cả loại</option>
              {uniqueKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kindLabel[kind] ?? kind}
                </option>
              ))}
            </select>
            <Button type="submit">Lọc</Button>
            <Link
              href="/approval/inbox"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--surface-alt)]"
            >
              Reset
            </Link>
          </form>

          {filteredApprovals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line-soft)] p-8 text-center text-sm text-[var(--text-soft)]">
              Không có request phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredApprovals.map((approval) => {
              const requester = employees.find((employee) => employee.id === approval.requested_by);
              const progress = getApprovalProgress(approval);
              return (
                <div
                  key={approval.id}
                  className="grid gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] p-4 xl:grid-cols-[1fr_380px]"
                >
                  <div className="min-w-0 space-y-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={kindTone[approval.kind] ?? "outline"}>
                          {kindLabel[approval.kind] ?? approval.kind}
                        </Badge>
                        <Badge variant={statusTone(approval.status)}>{statusLabel[approval.status]}</Badge>
                        <Badge variant="info">{progress.percent}% workflow</Badge>
                        <span className="text-xs text-[var(--text-soft)]">
                          {formatDate(approval.created_at)}
                        </span>
                      </div>
                      <div className="font-medium text-[var(--text-strong)]">{approval.title}</div>
                      <div className="mt-1 text-xs text-[var(--text-soft)]">
                        Yêu cầu bởi: {requester?.full_name ?? "Không rõ"}
                      </div>
                      <Link
                        href={`/approval/requests/${approval.id}`}
                        className="mt-3 inline-flex h-9 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] px-3 text-xs font-medium text-[var(--text-strong)] hover:bg-[var(--surface)]"
                      >
                        Xem chi tiet phieu
                      </Link>
                    </div>

                    <ApprovalRequestDetail approval={approval} />

                    <CurrentRouteCard approval={approval} employees={employees} />

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
                        <ShieldCheck className="h-4 w-4" />
                        Quy trinh duyet nhieu cap
                      </div>
                      <StepTimeline approval={approval} employees={employees} />
                    </div>

                    <details className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-[var(--text-strong)]">
                        Xem payload ky thuat
                      </summary>
                      <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--surface)] p-3 text-xs text-[var(--text-soft)]">
                        {JSON.stringify(approval.payload, null, 2)}
                      </pre>
                    </details>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
                          <UserRoundCheck className="h-4 w-4" />
                          Current approver
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[var(--text-strong)]">
                          {employeeName(employees, getCurrentApprovalStep(approval)?.approverEmployeeId)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
                          <Users className="h-4 w-4" />
                          Steps
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[var(--text-strong)]">
                          {progress.approved}/{progress.total}
                        </div>
                      </div>
                    </div>
                    <ApprovalActions approval={approval} employees={employees} currentEmployeeId={currentEmployeeId} />
                    {approval.decision_note && (
                      <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3 text-xs text-[var(--text-soft)]">
                        <span className="font-semibold text-[var(--text-strong)]">Ghi chú quyết định:</span>{" "}
                        {approval.decision_note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
