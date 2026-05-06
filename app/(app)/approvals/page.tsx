import Link from "next/link";
import { CheckCircle2, Clock, FileText, Search, XCircle } from "lucide-react";

import { approveRequestAction, rejectRequestAction } from "@/app/(app)/governance/actions";
import { KpiCard } from "@/components/kpi/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { tServer } from "@/lib/i18n/server";
import { fetchApprovals, fetchEmployees } from "@/lib/queries";
import type { Approval } from "@/types/domain";

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

function textParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function filterApprovals(
  approvals: Approval[],
  filter: { status: string; kind: string; q: string },
) {
  const q = filter.q.trim().toLowerCase();
  return approvals.filter((approval) => {
    const matchStatus = !filter.status || filter.status === "all" || approval.status === filter.status;
    const matchKind = !filter.kind || filter.kind === "all" || approval.kind === filter.kind;
    const searchText = `${approval.title} ${approval.kind} ${JSON.stringify(approval.payload)}`.toLowerCase();
    const matchQ = !q || searchText.includes(q);
    return matchStatus && matchKind && matchQ;
  });
}

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { t } = await tServer();
  const sp = await searchParams;
  const [approvals, employees] = await Promise.all([fetchApprovals(), fetchEmployees()]);

  const filter = {
    status: textParam(sp.status) || "pending",
    kind: textParam(sp.kind) || "all",
    q: textParam(sp.q),
  };
  const filteredApprovals = filterApprovals(approvals, filter);

  const pending = approvals.filter((a) => a.status === "pending").length;
  const approved = approvals.filter((a) => a.status === "approved").length;
  const rejected = approvals.filter((a) => a.status === "rejected").length;

  const byKind = Object.entries(
    approvals.reduce<Record<string, number>>((acc, a) => {
      acc[a.kind] = (acc[a.kind] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([kind, count]) => ({ kind, count }));
  const maxKindCount = Math.max(1, ...byKind.map((x) => x.count));
  const uniqueKinds = Array.from(new Set(approvals.map((a) => a.kind)));

  return (
    <div>
      <PageHeader
        helpKey="/approvals"
        title={t("approvals.title")}
        description="Approval Center Phase 1: lọc queue, duyệt/từ chối có ghi chú và lưu trạng thái trong demo mode."
        actions={<Button variant="outline">Phase 1: Queue MVP</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Chờ duyệt" value={String(pending)} accent="amber" icon={<Clock className="h-3.5 w-3.5" />} />
        <KpiCard label="Đã duyệt" value={String(approved)} accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <KpiCard label="Từ chối" value={String(rejected)} accent="red" icon={<XCircle className="h-3.5 w-3.5" />} />
        <KpiCard label="Tổng request" value={String(approvals.length)} accent="indigo" icon={<FileText className="h-3.5 w-3.5" />} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Theo loại yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={byKind.map((k) => ({
                label: kindLabel[k.kind] ?? k.kind,
                value: k.count,
                max: maxKindCount,
                right: `${k.count}`,
                color: "#6366f1",
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">SLA phê duyệt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Duyệt trong 24h" value="72%" tone="success" />
            <StatChip label="24-72h" value="22%" tone="warning" />
            <StatChip label="> 72h" value="6%" tone="danger" />
            <StatChip label="Thời gian TB" value="18.4h" tone="info" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phạm vi Phase 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Queue lọc được" value="OK" tone="success" />
            <StatChip label="Decision note" value="OK" tone="success" />
            <StatChip label="Demo persistence" value="OK" tone="success" />
            <StatChip label="Routing động" value="Phase sau" tone="warning" />
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
              <Input name="q" defaultValue={filter.q} placeholder="Tìm theo tiêu đề, loại, payload..." className="pl-9" />
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
              href="/approvals"
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
              const requester = employees.find((e) => e.id === approval.requested_by);
              return (
                <div
                  key={approval.id}
                  className="grid gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] p-4 lg:grid-cols-[1fr_360px]"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={kindTone[approval.kind] ?? "outline"}>
                        {kindLabel[approval.kind] ?? approval.kind}
                      </Badge>
                      <Badge variant={statusTone(approval.status)}>{statusLabel[approval.status]}</Badge>
                      <span className="text-xs text-[var(--text-soft)]">
                        {new Date(approval.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="font-medium text-[var(--text-strong)]">{approval.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      Yêu cầu bởi: {requester?.full_name ?? "Không rõ"}
                    </div>
                    <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--surface-alt)] p-3 text-xs text-[var(--text-soft)]">
                      {JSON.stringify(approval.payload, null, 2)}
                    </pre>
                    {approval.decision_note && (
                      <div className="mt-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3 text-xs text-[var(--text-soft)]">
                        <span className="font-semibold text-[var(--text-strong)]">Ghi chú quyết định:</span>{" "}
                        {approval.decision_note}
                      </div>
                    )}
                    {approval.decided_at && (
                      <div className="mt-2 text-xs text-[var(--text-soft)]">
                        Quyết định lúc: {new Date(approval.decided_at).toLocaleString("vi-VN")}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
                    {approval.status === "pending" ? (
                      <div className="space-y-3">
                        <form action={approveRequestAction} className="space-y-2">
                          <input type="hidden" name="approvalId" value={approval.id} />
                          <Input name="note" placeholder="Ghi chú khi duyệt..." />
                          <Button size="sm" type="submit" className="w-full">
                            Duyệt request
                          </Button>
                        </form>
                        <form action={rejectRequestAction} className="space-y-2">
                          <input type="hidden" name="approvalId" value={approval.id} />
                          <textarea
                            name="note"
                            placeholder="Lý do từ chối..."
                            className="min-h-20 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-soft)]/75 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
                          />
                          <Button size="sm" variant="outline" type="submit" className="w-full">
                            Từ chối request
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-28 items-center justify-center text-center text-sm text-[var(--text-soft)]">
                        Request này đã có quyết định. Phase sau sẽ bổ sung routing nhiều cấp, reassign và bulk approve.
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
