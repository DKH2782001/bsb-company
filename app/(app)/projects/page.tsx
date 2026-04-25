import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { ProjectsManager } from "@/components/projects/ProjectsManager";
import { fetchProjects, fetchEmployees } from "@/lib/queries";
import { formatCompactVND } from "@/lib/utils";
import type { Project } from "@/types/domain";
import { FolderKanban, CheckCircle2, Wallet, Target } from "lucide-react";

export default async function ProjectsPage() {
  const { t } = await tServer();
  const [projects, employees] = await Promise.all([fetchProjects(), fetchEmployees()]);

  type Row = Project & { owner_name: string };
  const rows: Row[] = projects.map((p) => ({
    ...p,
    owner_name: employees.find((e) => e.id === p.owner_id)?.full_name ?? "—",
  }));

  const active = projects.filter((p) => p.status === "active").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const statusSegments = [
    { name: "Active", value: active, color: "#6366f1" },
    { name: "Paused", value: projects.filter((p) => p.status === "paused").length, color: "#f59e0b" },
    { name: "Draft", value: projects.filter((p) => p.status === "draft").length, color: "#a1a1aa" },
    { name: "Done", value: projects.filter((p) => p.status === "done").length, color: "#10b981" },
  ];
  const totalCount = statusSegments.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div>
      <PageHeader
        helpKey="/projects"
        title={t("proj.title")}
        description={t("proj.subtitle")}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Tổng dự án" value={String(projects.length)} accent="indigo" icon={<FolderKanban className="h-3.5 w-3.5" />} />
        <KpiCard label="Đang chạy" value={String(active)} accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <KpiCard label="Tổng budget" value={formatCompactVND(totalBudget)} accent="amber" icon={<Wallet className="h-3.5 w-3.5" />} />
        <KpiCard label="Sắp deadline" value="2" accent="red" icon={<Target className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phân bổ theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut
              value={projects.length}
              label="Tổng dự án"
              height={200}
              segments={statusSegments.map((s) => ({ ...s, value: (s.value / totalCount) * 100 }))}
            />
            <div className="mt-3 space-y-1 text-xs">
              {statusSegments.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tiến độ dự án</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={projects.map((p, i) => {
                const pct = p.status === "done" ? 100 : p.status === "active" ? 40 + i * 10 : p.status === "paused" ? 55 : 10;
                return {
                  label: p.name,
                  value: pct,
                  max: 100,
                  right: `${pct}%`,
                  color: pct >= 80 ? "#10b981" : pct >= 40 ? "#6366f1" : "#f59e0b",
                };
              })}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ROI dự kiến</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="ROI trung bình" value="142%" tone="success" />
            <StatChip label="Over budget" value="1 dự án" tone="warning" />
            <StatChip label="Delay" value="1 dự án" tone="danger" />
            <StatChip label="On-track" value="2 dự án" tone="info" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Danh sách dự án</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectsManager rows={rows} employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
