import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDepartments, fetchEmployees, fetchKpis, fetchKpiActuals, fetchKpiTargets } from "@/lib/queries";
import { DepartmentsManager } from "@/components/departments/DepartmentsManager";
import { buildKpiRows } from "@/lib/kpi/cascade";
import { formatCompactVND } from "@/lib/utils";
import type { Department } from "@/types/domain";

export const revalidate = 300;

export default async function DepartmentsPage() {
  const { t } = await tServer();
  const [departments, employees, kpis, targets, actuals] = await Promise.all([
    fetchDepartments(),
    fetchEmployees(),
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
  ]);

  const rows = buildKpiRows(kpis, targets, actuals);

  type Row = Department & {
    head_name: string;
    headcount: number;
    kpi_status: "green" | "yellow" | "red" | "na";
    kpi_completion: number | null;
  };

  const tableRows: Row[] = departments.map((d) => {
    const head = employees.find((e) => e.id === d.head_employee_id);
    const headcount = employees.filter((e) => e.department_id === d.id).length;
    const deptKpi = rows.find((r) => r.level === "department" && r.owner_department_id === d.id);
    return {
      ...d,
      head_name: head?.full_name ?? "—",
      headcount,
      kpi_status: deptKpi?.status ?? "na",
      kpi_completion: deptKpi?.completion ?? null,
    };
  });

  const totalBudget = departments.reduce((s, d) => s + d.budget_monthly, 0);

  return (
    <div>
      <PageHeader
        helpKey="/departments"
        title={t("depts.title")}
        description={t("depts.subtitle")}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-xs text-zinc-500">Phòng ban</div>
          <div className="text-2xl font-bold">{departments.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500">Tổng budget/tháng</div>
          <div className="text-2xl font-bold">{formatCompactVND(totalBudget)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500">Nhân sự</div>
          <div className="text-2xl font-bold">{employees.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500">KPI đỏ</div>
          <div className="text-2xl font-bold text-red-600">
            {tableRows.filter((r) => r.kpi_status === "red").length}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách phòng ban</CardTitle>
          <Badge variant="outline">{departments.length}</Badge>
        </CardHeader>
        <CardContent>
          <DepartmentsManager rows={tableRows} employees={employees} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
