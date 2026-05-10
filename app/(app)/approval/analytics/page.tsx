import { BarChart3, Clock, FileWarning, Trophy } from "lucide-react";

import { KpiCard } from "@/components/kpi/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressList } from "@/components/widgets/ProgressList";
import { fetchApprovals, fetchEmployees } from "@/lib/queries";

export default async function ApprovalAnalyticsPage() {
  const [approvals, employees] = await Promise.all([fetchApprovals(), fetchEmployees()]);
  const approved = approvals.filter((approval) => approval.status === "approved");
  const pending = approvals.filter((approval) => approval.status === "pending");
  const rejected = approvals.filter((approval) => approval.status === "rejected");
  const byKind = Object.entries(
    approvals.reduce<Record<string, number>>((acc, approval) => {
      acc[approval.kind] = (acc[approval.kind] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([kind, count]) => ({ kind, count }));
  const maxKind = Math.max(1, ...byKind.map((item) => item.count));
  const approverRanking = employees.slice(0, 5).map((employee, index) => ({
    label: employee.full_name,
    value: Math.max(1, approved.length - index),
  }));
  const maxRanking = Math.max(1, ...approverRanking.map((item) => item.value));

  return (
    <div>
      <PageHeader
        helpKey="/approval/analytics"
        title="Chan doan hieu qua phe duyet"
        description="Theo doi toc do xu ly, backlog, bottleneck va volume theo loai request."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Da duyet" value={String(approved.length)} accent="emerald" icon={<Trophy className="h-3.5 w-3.5" />} />
        <KpiCard label="Dang cho" value={String(pending.length)} accent="amber" icon={<Clock className="h-3.5 w-3.5" />} />
        <KpiCard label="Bi tu choi" value={String(rejected.length)} accent="red" icon={<FileWarning className="h-3.5 w-3.5" />} />
        <KpiCard label="Tong request" value={String(approvals.length)} accent="indigo" icon={<BarChart3 className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Volume theo loai request</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={byKind.map((item) => ({
                label: item.kind,
                value: item.count,
                max: maxKind,
                right: String(item.count),
                color: "#2563eb",
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ranking nguoi duyet demo</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={approverRanking.map((item) => ({
                label: item.label,
                value: item.value,
                max: maxRanking,
                right: `${item.value} request`,
                color: "#059669",
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
