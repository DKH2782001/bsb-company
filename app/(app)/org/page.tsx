import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { OrgGraph } from "@/components/org/OrgGraphLazy";
import { ProgressList } from "@/components/widgets/ProgressList";
import { ActivityFeed } from "@/components/widgets/ActivityFeed";
import { StatChip } from "@/components/widgets/StatChip";
import { BarCompare } from "@/components/charts/BarCompare";
import {
  fetchDepartments,
  fetchEmployees,
  fetchKpis,
  fetchKpiTargets,
  fetchKpiActuals,
  demo,
} from "@/lib/queries";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { formatCompactVND } from "@/lib/utils";
import { Users, Network, Wallet, Target, Sparkles } from "lucide-react";

export const revalidate = 300;

export default async function OrgPage() {
  const { t } = await tServer();
  const [departments, employees, kpis, targets, actuals] = await Promise.all([
    fetchDepartments(),
    fetchEmployees(),
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
  ]);

  const rows = buildKpiRows(kpis, targets, actuals);

  const totalHeadcount = employees.length;
  const totalPayroll = employees.reduce((s, e) => s + e.base_salary, 0);
  const spanOfControl = (totalHeadcount / departments.length).toFixed(1);
  const companyKpiAvg =
    rows.filter((r) => r.level === "company").reduce((s, r) => s + (r.completion ?? 0), 0) /
    Math.max(1, rows.filter((r) => r.level === "company").length);

  const deptBars = departments.map((d) => {
    const count = employees.filter((e) => e.department_id === d.id).length;
    return { label: d.name, headcount: count, budget: d.budget_monthly };
  });

  const positionDistro = [
    { name: "Senior", value: 3, color: "#6366f1" },
    { name: "Mid", value: 6, color: "#8b5cf6" },
    { name: "Junior", value: 4, color: "#10b981" },
    { name: "Head", value: 1, color: "#f59e0b" },
  ];

  const growthSpark = [72, 74, 75, 78, 82, 84];
  const payrollSpark = [420, 440, 450, 452, 454, 454].map((x) => x * 1_000_000);

  return (
    <div>
      <PageHeader
        helpKey="/org"
        title={t("org.title")}
        description={t("org.subtitle")}
        actions={<Badge variant="info">{demo.demoCompany.name}</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard
          label="Nhân sự"
          value={String(totalHeadcount)}
          hint="active"
          accent="indigo"
          icon={<Users className="h-3.5 w-3.5" />}
          spark={growthSpark}
          delta={3.1}
        />
        <KpiCard
          label="Phòng ban"
          value={String(departments.length)}
          accent="violet"
          icon={<Network className="h-3.5 w-3.5" />}
          spark={[6, 6, 6, 6, 6, 6]}
        />
        <KpiCard
          label="Quỹ lương/tháng"
          value={formatCompactVND(totalPayroll)}
          accent="emerald"
          icon={<Wallet className="h-3.5 w-3.5" />}
          spark={payrollSpark}
          delta={1.2}
        />
        <KpiCard
          label="Span of control"
          value={`1 : ${spanOfControl}`}
          accent="amber"
          hint="tối ưu 1:5–1:8"
        />
        <KpiCard
          label="KPI công ty"
          value={`${Math.round(companyKpiAvg * 100)}%`}
          accent="cyan"
          icon={<Target className="h-3.5 w-3.5" />}
          spark={[85, 87, 88, 89, 90, Math.round(companyKpiAvg * 100)]}
          delta={2.3}
        />
        <KpiCard
          label="Mới tuyển tháng"
          value="3"
          accent="rose"
          hint="1 Sales · 1 Ops · 1 CS"
          spark={[1, 2, 1, 3, 2, 3]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Cây tổ chức</CardTitle>
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="outline">Organizational</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <OrgGraph company={demo.demoCompany} departments={departments} employees={employees} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KPI hoàn thành toàn tổ chức</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut value={companyKpiAvg} label="Completion" height={220} />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <StatChip label="Green" value={rows.filter((r) => r.status === "green").length} tone="success" />
              <StatChip label="Yellow" value={rows.filter((r) => r.status === "yellow").length} tone="warning" />
              <StatChip label="Red" value={rows.filter((r) => r.status === "red").length} tone="danger" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phòng ban & head</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {departments.map((d) => {
              const count = employees.filter((e) => e.department_id === d.id).length;
              const head = employees.find((e) => e.id === d.head_employee_id);
              return (
                <Link
                  key={d.id}
                  href={`/departments/${d.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 p-2.5 hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 truncate">{d.name}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {head?.full_name ?? "Chưa có head"} · {count} người
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-zinc-900">
                      {formatCompactVND(d.budget_monthly)}
                    </div>
                    <div className="text-[10px] text-zinc-400">budget/tháng</div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phân bổ nhân sự theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <BarCompare
              data={deptBars}
              bars={[{ key: "headcount", name: "Headcount", color: "#6366f1" }]}
              height={220}
              axisFormat="number"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cấp bậc & trình độ</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut
              value={totalHeadcount}
              label="Tổng nhân sự"
              height={180}
              segments={positionDistro}
            />
            <div className="mt-3 space-y-1 text-xs">
              {positionDistro.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.name}
                  </span>
                  <span className="font-medium text-zinc-900">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hoạt động tổ chức gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              items={[
                { id: "1", actor: "Trần Thị B", action: "thêm nhân sự Đinh Hà O vào HR", time: "hôm qua", avatarColor: "bg-indigo-600" },
                { id: "2", actor: "Nguyễn Văn A", action: "bổ nhiệm Head of Marketing", time: "3 ngày trước", avatarColor: "bg-violet-600" },
                { id: "3", actor: "Lê Văn C", action: "tăng budget phòng Sales 10%", time: "1 tuần trước", avatarColor: "bg-emerald-600" },
                { id: "4", actor: "Trần Thị B", action: "mở 3 requisition mới", time: "1 tuần trước", avatarColor: "bg-amber-500" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Cảnh báo tổ chức
            </CardTitle>
            <Link href="/alerts" className="text-xs text-indigo-600">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { title: "Nhân viên Nguyễn Hải H quá tải (18 task)", tone: "warning" as const },
              { title: "Span of control Sales = 1:9 — gần quá ngưỡng", tone: "warning" as const },
              { title: "Phòng Ops thiếu 1 specialist theo plan Q2", tone: "danger" as const },
              { title: "Marketing budget vượt 8% — cần điều chỉnh", tone: "warning" as const },
            ].map((a) => (
              <div
                key={a.title}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-2.5 text-sm"
              >
                <span className="text-zinc-700">{a.title}</span>
                <Badge variant={a.tone}>{a.tone}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">KPI trung bình theo phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressList
            rows={departments.map((d) => {
              const deptKpis = rows.filter((r) => r.owner_department_id === d.id);
              const avg = Math.round(
                (deptKpis.reduce((s, k) => s + (k.completion ?? 0), 0) /
                  Math.max(1, deptKpis.length)) *
                  100,
              );
              return {
                label: d.name,
                value: avg,
                max: 100,
                right: `${avg}%`,
                color: avg >= 100 ? "#10b981" : avg >= 85 ? "#f59e0b" : "#ef4444",
              };
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
