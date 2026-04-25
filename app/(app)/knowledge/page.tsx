import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi/KpiCard";
import { StatChip } from "@/components/widgets/StatChip";
import { ProgressList } from "@/components/widgets/ProgressList";
import { BookOpen, FileCheck, Shield, CheckSquare, FileText } from "lucide-react";
import { fetchSops, fetchDepartments } from "@/lib/queries";
import { createSopAction } from "@/app/(app)/workspace/actions";

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
        actions={<Button>+ SOP</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Tổng SOP" value={String(sops.length)} accent="indigo" icon={<BookOpen className="h-3.5 w-3.5" />} />
        <KpiCard label="Published" value={String(published)} accent="emerald" icon={<FileCheck className="h-3.5 w-3.5" />} />
        <KpiCard label="Phòng ban có SOP" value={`${byDept.filter((b) => b.docs.length > 0).length}/${departments.length}`} accent="violet" />
        <KpiCard label="Version TB" value={avgVersion} accent="amber" icon={<Shield className="h-3.5 w-3.5" />} />
        <KpiCard label="Checklist" value="12" accent="cyan" icon={<CheckSquare className="h-3.5 w-3.5" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Tạo SOP mới</CardTitle></CardHeader>
        <CardContent>
          <form action={createSopAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Tên SOP" required />
            <select name="departmentId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
              <option value="">Phòng ban</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <Input name="body" placeholder="Mô tả ngắn / nội dung" />
            <Button type="submit">Tạo SOP</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">SOP theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {byDept.map(({ dept, docs }) => (
                <Card key={dept.id} className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{dept.name}</CardTitle>
                    <div className="text-xs text-zinc-500">{docs.length} tài liệu</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {docs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-start gap-2 rounded-lg border border-zinc-100 p-2"
                      >
                        <FileText className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-zinc-900 truncate">{d.title}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline">v{d.version}</Badge>
                            {d.published ? (
                              <Badge variant="success">Published</Badge>
                            ) : (
                              <Badge variant="warning">Draft</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {docs.length === 0 && (
                      <div className="text-xs text-zinc-400 text-center py-3">
                        Chưa có SOP
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
