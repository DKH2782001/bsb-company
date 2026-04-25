import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchDepartments, fetchAccounting } from "@/lib/queries";
import { saveDepartmentBudgetAction } from "@/app/(app)/workspace/actions";
import { buildBudgetVarianceRows } from "@/lib/finance/statements";
import { formatCompactVND, formatPercent } from "@/lib/utils";

export const revalidate = 300;

export default async function BudgetPage() {
  const [departments, entries] = await Promise.all([fetchDepartments(), fetchAccounting()]);

  type Row = {
    id: string;
    name: string;
    planned: number;
    actual: number;
    variance: number;
    variance_pct: number;
  };

  const rows: Row[] = buildBudgetVarianceRows(departments, entries);

  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalVar = totalActual - totalPlanned;

  const columns: Column<Row>[] = [
    { key: "name", header: "Phòng ban", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "planned", header: "Kế hoạch", align: "right", render: (r) => formatCompactVND(r.planned) },
    { key: "actual", header: "Thực tế", align: "right", render: (r) => formatCompactVND(r.actual) },
    {
      key: "variance",
      header: "Chênh lệch",
      align: "right",
      render: (r) => (
        <span className={r.variance > 0 ? "text-red-700" : "text-emerald-700"}>
          {r.variance > 0 ? "+" : ""}
          {formatCompactVND(r.variance)}
        </span>
      ),
    },
    {
      key: "pct",
      header: "",
      align: "right",
      render: (r) => (
        <Badge variant={r.variance_pct > 5 ? "danger" : r.variance_pct < -5 ? "success" : "warning"}>
          {formatPercent(r.variance_pct, 1)}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Budget vs Actual" description="Đối chiếu ngân sách phòng ban tháng 4/2026" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-xs text-zinc-500">Tổng planned</div>
          <div className="text-2xl font-bold">{formatCompactVND(totalPlanned)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500">Tổng actual</div>
          <div className="text-2xl font-bold">{formatCompactVND(totalActual)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500">Chênh lệch</div>
          <div className={`text-2xl font-bold ${totalVar > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {formatCompactVND(totalVar)}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cập nhật budget phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveDepartmentBudgetAction} className="grid gap-3 md:grid-cols-3">
            <select name="departmentId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
              <option value="">Chọn phòng ban</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <Input name="budgetMonthly" type="number" placeholder="Budget tháng mới" required />
            <Button type="submit">Lưu budget</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết theo phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
