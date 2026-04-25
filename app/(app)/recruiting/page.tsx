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
import { fetchRequisitions, fetchDepartments } from "@/lib/queries";
import { createRequisitionAction } from "@/app/(app)/workspace/actions";
import type { JobRequisition } from "@/types/domain";
import { UserPlus, Users, Clock, Award } from "lucide-react";

export default async function RecruitingPage() {
  const { t } = await tServer();
  const [requisitions, departments] = await Promise.all([
    fetchRequisitions(),
    fetchDepartments(),
  ]);

  type Row = JobRequisition & { dept_name: string };
  const rows: Row[] = requisitions.map((r) => ({
    ...r,
    dept_name: departments.find((d) => d.id === r.department_id)?.name ?? "—",
  }));

  const open = requisitions.filter((r) => r.status === "open").length;
  const totalHeadcount = requisitions.reduce((s, r) => s + r.headcount, 0);

  const pipelineStages = [
    { name: "Mới", value: 32, color: "#6366f1" },
    { name: "Screening", value: 14, color: "#8b5cf6" },
    { name: "Interview", value: 6, color: "#f59e0b" },
    { name: "Offer", value: 2, color: "#10b981" },
  ];
  const pipelineTotal = pipelineStages.reduce((s, x) => s + x.value, 0);

  const skillGaps = [
    { skill: "Performance Marketing", current: 2, target: 4, dept: "Marketing" },
    { skill: "Enterprise Sales", current: 3, target: 5, dept: "Sales" },
    { skill: "Data Analytics", current: 1, target: 3, dept: "Operations" },
    { skill: "Customer Success Ops", current: 2, target: 3, dept: "CS" },
    { skill: "Finance analyst", current: 1, target: 2, dept: "Finance" },
  ];

  const columns: Column<Row>[] = [
    { key: "title", header: "Vị trí", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "dept", header: "Phòng ban", render: (r) => r.dept_name },
    { key: "headcount", header: "Số lượng", align: "center", render: (r) => String(r.headcount) },
    { key: "opened", header: "Mở", render: (r) => r.opened_at ?? "—" },
    {
      key: "status",
      header: "",
      align: "right",
      render: (r) => (
        <Badge
          variant={r.status === "open" ? "info" : r.status === "pipeline" ? "warning" : "outline"}
        >
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/recruiting"
        title={t("recruiting.title")}
        description={t("recruiting.subtitle")}
        actions={<Button>+ {t("nav.recruiting")}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Vị trí mở" value={String(open)} accent="indigo" icon={<UserPlus className="h-3.5 w-3.5" />} />
        <KpiCard label="Headcount cần" value={String(totalHeadcount)} accent="violet" icon={<Users className="h-3.5 w-3.5" />} />
        <KpiCard label="Candidates" value={String(pipelineTotal)} accent="emerald" spark={[40, 42, 48, 50, 52, pipelineTotal]} />
        <KpiCard label="Time-to-hire TB" value="38 ngày" accent="amber" icon={<Clock className="h-3.5 w-3.5" />} spark={[45, 42, 40, 38, 38, 38]} delta={-15} />
        <KpiCard label="Skill gap" value={String(skillGaps.length)} accent="red" icon={<Award className="h-3.5 w-3.5" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Mở requisition mới</CardTitle></CardHeader>
        <CardContent>
          <form action={createRequisitionAction} className="grid gap-3 md:grid-cols-4">
            <Input name="title" placeholder="Vị trí tuyển" required />
            <select name="departmentId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
              <option value="">Phòng ban</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <Input name="headcount" type="number" placeholder="Headcount" defaultValue="1" />
            <Button type="submit">Tạo requisition</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pipeline ứng viên</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut
              value={pipelineTotal}
              label="Candidates"
              height={200}
              segments={pipelineStages.map((s) => ({ ...s, value: (s.value / pipelineTotal) * 100 }))}
            />
            <div className="mt-3 space-y-1 text-xs">
              {pipelineStages.map((s) => (
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
            <CardTitle className="text-sm">Skill gap</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={skillGaps.map((g) => ({
                label: `${g.skill} (${g.dept})`,
                value: g.current,
                max: g.target,
                right: `${g.current}/${g.target}`,
                color: g.current >= g.target ? "#10b981" : g.current / g.target >= 0.6 ? "#f59e0b" : "#ef4444",
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nguồn ứng viên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Referral" value="38%" tone="success" />
            <StatChip label="LinkedIn" value="24%" tone="info" />
            <StatChip label="Website" value="20%" tone="violet" />
            <StatChip label="Other" value="18%" tone="default" />
            <div className="text-xs text-zinc-500 mt-2">Referral luôn chất lượng nhất — push bonus giới thiệu.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Job requisitions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
