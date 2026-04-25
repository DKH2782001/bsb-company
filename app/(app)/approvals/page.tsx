import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchApprovals, fetchEmployees } from "@/lib/queries";
import { approveRequestAction, rejectRequestAction } from "@/app/(app)/governance/actions";
import { Clock, CheckCircle2, XCircle, FileText } from "lucide-react";

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

export default async function ApprovalsPage() {
  const { t } = await tServer();
  const [approvals, employees] = await Promise.all([fetchApprovals(), fetchEmployees()]);

  const pending = approvals.filter((a) => a.status === "pending").length;
  const approved = approvals.filter((a) => a.status === "approved").length;
  const rejected = approvals.filter((a) => a.status === "rejected").length;

  const byKind = Object.entries(
    approvals.reduce<Record<string, number>>((acc, a) => {
      acc[a.kind] = (acc[a.kind] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([kind, count]) => ({ kind, count }));

  return (
    <div>
      <PageHeader
        helpKey="/approvals"
        title={t("approvals.title")}
        description={t("approvals.subtitle")}
        actions={<Button variant="outline">Workflow</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Pending" value={String(pending)} accent="amber" icon={<Clock className="h-3.5 w-3.5" />} />
        <KpiCard label="Approved" value={String(approved)} accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <KpiCard label="Rejected" value={String(rejected)} accent="red" icon={<XCircle className="h-3.5 w-3.5" />} />
        <KpiCard label="Tổng" value={String(approvals.length)} accent="indigo" icon={<FileText className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Theo loại yêu cầu</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={byKind.map((k) => ({
                label: kindLabel[k.kind] ?? k.kind,
                value: k.count,
                max: Math.max(...byKind.map((x) => x.count)),
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
            <StatChip label="&gt; 72h" value="6%" tone="danger" />
            <StatChip label="Thời gian TB" value="18.4h" tone="info" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cấp duyệt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="CEO duyệt cuối" value={approved + pending} tone="info" />
            <StatChip label="HR duyệt cấp 1" value={byKind.find((k) => k.kind === "job_requisition")?.count ?? 0} tone="violet" />
            <StatChip label="CFO duyệt cấp 1" value={byKind.find((k) => k.kind === "project_budget")?.count ?? 0} tone="success" />
            <StatChip label="Dept Head duyệt" value="4" tone="default" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Yêu cầu phê duyệt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {approvals.map((a) => {
            const requester = employees.find((e) => e.id === a.requested_by);
            return (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={kindTone[a.kind] ?? "outline"}>
                      {kindLabel[a.kind] ?? a.kind}
                    </Badge>
                    <Badge
                      variant={
                        a.status === "approved"
                          ? "success"
                          : a.status === "rejected"
                            ? "danger"
                            : a.status === "cancelled"
                              ? "outline"
                              : "warning"
                      }
                    >
                      {a.status}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {new Date(a.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="font-medium text-zinc-900">{a.title}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Yêu cầu bởi: {requester?.full_name ?? "—"}
                  </div>
                  <pre className="text-xs text-zinc-500 mt-1 font-mono">
                    {JSON.stringify(a.payload, null, 0)}
                  </pre>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <form action={rejectRequestAction}>
                      <input type="hidden" name="approvalId" value={a.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Từ chối
                      </Button>
                    </form>
                    <form action={approveRequestAction}>
                      <input type="hidden" name="approvalId" value={a.id} />
                      <Button size="sm" type="submit">Duyệt</Button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
