import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { StatChip } from "@/components/widgets/StatChip";
import { ProgressList } from "@/components/widgets/ProgressList";
import { BookOpen, FileCheck, Shield, CheckSquare } from "lucide-react";
import { fetchSops, fetchDepartments } from "@/lib/queries";
import { KnowledgeManager } from "@/components/knowledge/KnowledgeManager";

export const revalidate = 300;

export default async function KnowledgePage() {
  const { t } = await tServer();
  const [sops, departments] = await Promise.all([fetchSops(), fetchDepartments()]);

  const byDept = departments.map((d) => ({
    dept: d,
    docs: sops.filter((s) => s.department_id === d.id),
  }));

  const published = sops.filter((s) => s.published).length;
  const avgVersion = sops.length
    ? (sops.reduce((s, d) => s + d.version, 0) / sops.length).toFixed(1)
    : "0";
  const sopPopularity = sops.map((s, index) => {
    const value = 76 + ((s.version + index * 7) % 21);
    return {
      label: s.title,
      value,
      max: 100,
      right: `${value} lượt xem`,
      color: "#6366f1",
    };
  });

  return (
    <div>
      <PageHeader
        helpKey="/knowledge"
        title={t("knowledge.title")}
        description={t("knowledge.subtitle")}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Tổng SOP" value={String(sops.length)} accent="indigo" icon={<BookOpen className="h-3.5 w-3.5" />} />
        <KpiCard label="Published" value={String(published)} accent="emerald" icon={<FileCheck className="h-3.5 w-3.5" />} />
        <KpiCard label="Phòng ban có SOP" value={`${byDept.filter((b) => b.docs.length > 0).length}/${departments.length}`} accent="violet" />
        <KpiCard label="Version TB" value={avgVersion} accent="amber" icon={<Shield className="h-3.5 w-3.5" />} />
        <KpiCard label="Checklist" value="12" accent="cyan" icon={<CheckSquare className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">SOP theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeManager sops={sops} departments={departments} />
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">SOP phổ biến</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressList rows={sopPopularity} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatChip label="SOP đã acknowledge" value="84%" tone="success" />
              <StatChip label="Chưa acknowledge" value="16%" tone="warning" />
              <StatChip label="Cần cập nhật (>6 tháng)" value="2 SOP" tone="warning" />
              <StatChip label="Retention policy" value="Active" tone="info" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {[
              { name: "Onboarding nhân sự mới", count: "12 items" },
              { name: "Qualify lead", count: "6 items" },
              { name: "Close đơn B2B", count: "9 items" },
              { name: "Xử lý khiếu nại", count: "7 items" },
              { name: "Chấm công cuối tháng", count: "4 items" },
              { name: "Chạy payroll", count: "11 items" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  <span className="text-zinc-700">{c.name}</span>
                </div>
                <Badge variant="outline">{c.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
