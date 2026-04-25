import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchProjects, fetchEmployees } from "@/lib/queries";
import { createProjectAction } from "@/app/(app)/workspace/actions";
import { formatCompactVND } from "@/lib/utils";
import type { Project } from "@/types/domain";
import { FolderKanban, CheckCircle2, Wallet, Target } from "lucide-react";

const statusTone: Record<Project["status"], "success" | "info" | "warning" | "outline" | "danger"> = {
  draft: "outline",
  active: "info",
  paused: "warning",
  done: "success",
  cancelled: "danger",
};

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

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Dự án",
      render: (p) => (
        <Link href={`/projects/${p.id}`} className="font-medium hover:text-indigo-700">
          {p.name}
          <div className="text-xs text-zinc-500 font-mono">{p.code}</div>
        </Link>
      ),
    },
    { key: "owner", header: "Owner", render: (p) => p.owner_name },
    { key: "budget", header: "Budget", align: "right", render: (p) => formatCompactVND(p.budget) },
    { key: "start", header: "Bắt đầu", render: (p) => p.starts_at ?? "—" },
    { key: "end", header: "Kết thúc", render: (p) => p.ends_at ?? "—" },
    {
      key: "status",
      header: "",
      align: "right",
      render: (p) => <Badge variant={statusTone[p.status]}>{p.status}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/projects"
        title={t("proj.title")}
        description={t("proj.subtitle")}
        actions={<Button>{t("proj.new")}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Tổng dự án" value={String(projects.length)} accent="indigo" icon={<FolderKanban className="h-3.5 w-3.5" />} />
        <KpiCard label="Đang chạy" value={String(active)} accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <KpiCard label="Tổng budget" value={formatCompactVND(totalBudget)} accent="amber" icon={<Wallet className="h-3.5 w-3.5" />} />
        <KpiCard label="Sắp deadline" value="2" accent="red" icon={<Target className="h-3.5 w-3.5" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Tạo dự án mới</CardTitle></CardHeader>
        <CardContent>
          <form action={createProjectAction} className="grid gap-3 md:grid-cols-6">
            <Input name="name" placeholder="Tên dự án" required />
            <Input name="code" placeholder="Mã dự án" />
            <select name="ownerId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
              <option value="">Owner</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.full_name}</option>
              ))}
            </select>
            <Input name="budget" type="number" placeholder="Budget" required />
            <Input name="startsAt" type="date" />
            <Button type="submit">Tạo dự án</Button>
          </form>
        </CardContent>
      </Card>

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
          <DataTable columns={columns} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
