import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { fetchProjects, fetchEmployees, fetchTasks } from "@/lib/queries";
import { formatCompactVND } from "@/lib/utils";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projects, employees, tasks] = await Promise.all([
    fetchProjects(),
    fetchEmployees(),
    fetchTasks(),
  ]);

  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  const owner = employees.find((e) => e.id === project.owner_id);
  const projectTasks = tasks.filter((t) => t.project_id === project.id);

  return (
    <div>
      <PageHeader
        title={project.name}
        description={`${project.code ?? ""} · Owner: ${owner?.full_name ?? "—"}`}
        actions={<Badge variant="info">{project.status}</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Budget" value={formatCompactVND(project.budget)} accent="indigo" />
        <KpiCard label="Thời gian" value={`${project.starts_at ?? "—"} → ${project.ends_at ?? "—"}`} accent="violet" />
        <KpiCard label="Task trong dự án" value={String(projectTasks.length)} accent="emerald" />
        <KpiCard label="Trạng thái" value={project.status} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Business case</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-700">
            {project.business_case ?? "Chưa cập nhật business case."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Milestone tracking sẽ được thêm ở bước sau — hiện chưa có milestone nào.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ROI dự kiến</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-700 space-y-2">
          <p>Expected return: TBD — cần bổ sung từ module Finance.</p>
          <p>Realized return: ghi nhận khi hoàn thành milestones.</p>
          <p>ROI sẽ được tính tự động qua trigger từ `project_roi_records` khi phase 5 hoàn tất.</p>
        </CardContent>
      </Card>
    </div>
  );
}
