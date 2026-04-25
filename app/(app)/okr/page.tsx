import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchObjectives, fetchKeyResults, fetchEmployees, fetchDepartments } from "@/lib/queries";
import { Flag, Target, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function OkrPage() {
  const { t } = await tServer();
  const [objs, krs, employees, departments] = await Promise.all([
    fetchObjectives(),
    fetchKeyResults(),
    fetchEmployees(),
    fetchDepartments(),
  ]);

  const onTrack = objs.filter((o) => (o.status ?? "").includes("on_track")).length;
  const atRisk = objs.filter((o) => (o.status ?? "").includes("at_risk")).length;
  const done = objs.filter((o) => o.progress_pct >= 100).length;
  const avgProgress = objs.length
    ? objs.reduce((s, o) => s + o.progress_pct, 0) / objs.length
    : 0;

  const companyObjs = objs.filter((o) => o.level === "company");
  const deptObjs = objs.filter((o) => o.level === "department");

  return (
    <div>
      <PageHeader
        helpKey="/okr"
        title={t("okr.title")}
        description={t("okr.subtitle")}
        actions={<Button>{t("okr.new")}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Objectives" value={String(objs.length)} accent="indigo" icon={<Flag className="h-3.5 w-3.5" />} />
        <KpiCard label="Company" value={String(companyObjs.length)} accent="violet" />
        <KpiCard label="On-track" value={String(onTrack)} accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <KpiCard label="At-risk" value={String(atRisk)} accent="amber" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
        <KpiCard
          label="Progress TB"
          value={`${Math.round(avgProgress)}%`}
          accent="cyan"
          icon={<Target className="h-3.5 w-3.5" />}
          spark={[40, 48, 52, 56, 60, Math.round(avgProgress)]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tiến độ OKR công ty</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut value={avgProgress} label="Progress TB" height={200} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <StatChip label="On-track" value={onTrack} tone="success" />
              <StatChip label="At-risk" value={atRisk} tone="warning" />
              <StatChip label="Done" value={done} tone="info" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">OKR theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={departments.map((d) => {
                const deptObj = deptObjs.find((o) => o.owner_department_id === d.id);
                const pct = deptObj?.progress_pct ?? 0;
                return {
                  label: d.name,
                  value: pct,
                  max: 100,
                  right: deptObj ? `${pct}%` : "—",
                  color: pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444",
                };
              })}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Alignment KPI → OKR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-lg border border-zinc-100 p-3">
              <div className="text-xs text-zinc-500 mb-1">O2 · Revenue 60 tỷ/năm</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="info">REV</Badge>
                <Badge variant="info">SAL.CLOSE</Badge>
                <Badge variant="info">MKT.LEADS</Badge>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 p-3">
              <div className="text-xs text-zinc-500 mb-1">O3 · Close rate → 40%</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="info">SAL.CLOSE</Badge>
                <Badge variant="info">E8.CLOSE</Badge>
                <Badge variant="info">E9.CLOSE</Badge>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 p-3">
              <div className="text-xs text-zinc-500 mb-1">O4 · 2000 leads/tháng</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="info">MKT.LEADS</Badge>
                <Badge variant="info">E10.CONTENT</Badge>
                <Badge variant="info">E11.CPL</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {objs.map((o) => {
          const owner = employees.find((e) => e.id === o.owner_employee_id);
          const dept = departments.find((d) => d.id === o.owner_department_id);
          const objKrs = krs.filter((k) => k.objective_id === o.id);
          return (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{o.level}</Badge>
                      <Badge variant="info">{o.period}</Badge>
                      {o.status === "on_track" && <Badge variant="success">On-track</Badge>}
                      {o.status === "at_risk" && <Badge variant="warning">At-risk</Badge>}
                    </div>
                    <CardTitle className="text-base">{o.title}</CardTitle>
                    <div className="text-xs text-zinc-500 mt-1">
                      {owner?.full_name ?? dept?.name ?? "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-zinc-900">{o.progress_pct}%</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-2 rounded-full bg-zinc-100 mb-3">
                  <div
                    className={`h-2 rounded-full ${
                      o.progress_pct >= 80
                        ? "bg-emerald-500"
                        : o.progress_pct >= 50
                          ? "bg-indigo-500"
                          : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, o.progress_pct)}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {objKrs.map((kr) => (
                    <div key={kr.id} className="rounded-lg border border-zinc-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-700">{kr.title}</span>
                        <Badge variant="outline">{kr.progress_pct}%</Badge>
                      </div>
                      {kr.target_value != null && (
                        <div className="text-xs text-zinc-500">
                          {kr.actual_value?.toLocaleString("vi-VN") ?? "—"} /{" "}
                          {kr.target_value.toLocaleString("vi-VN")} {kr.unit ?? ""}
                        </div>
                      )}
                    </div>
                  ))}
                  {objKrs.length === 0 && (
                    <div className="text-xs text-zinc-400 text-center py-4">
                      Chưa có Key Result
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
