import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiStatusBadge } from "@/components/kpi/KpiStatusBadge";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { fetchKpis, fetchKpiTargets, fetchKpiActuals, fetchEmployees, fetchDepartments } from "@/lib/queries";
import { buildKpiRows } from "@/lib/kpi/cascade";

export default async function KpiDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [kpis, targets, actuals, employees, departments] = await Promise.all([
    fetchKpis(),
    fetchKpiTargets(),
    fetchKpiActuals(),
    fetchEmployees(),
    fetchDepartments(),
  ]);

  const rows = buildKpiRows(kpis, targets, actuals);
  const row = rows.find((r) => r.id === id);
  if (!row) notFound();

  const parent = rows.find((r) => r.id === row.parent_kpi_id);
  const children = rows.filter((r) => r.parent_kpi_id === row.id);
  const owner =
    employees.find((e) => e.id === row.owner_employee_id)?.full_name ??
    departments.find((d) => d.id === row.owner_department_id)?.name ??
    "—";

  const childColumns: Column<(typeof rows)[number]>[] = [
    {
      key: "name",
      header: "KPI con",
      render: (r) => (
        <Link href={`/kpi/${r.id}`} className="font-medium hover:text-indigo-700">
          {r.name}
          <div className="text-xs text-zinc-500 font-mono">{r.code}</div>
        </Link>
      ),
    },
    { key: "weight", header: "Trọng số", align: "right", render: (r) => r.weight.toFixed(2) },
    { key: "target", header: "Target", align: "right", render: (r) => r.target?.toLocaleString("vi-VN") ?? "—" },
    { key: "actual", header: "Thực tế", align: "right", render: (r) => r.actual?.toLocaleString("vi-VN") ?? "—" },
    { key: "status", header: "", align: "right", render: (r) => <KpiStatusBadge status={r.status} completion={r.completion} /> },
  ];

  return (
    <div>
      <PageHeader
        title={row.name}
        description={`${row.code ?? ""} · ${row.level} · Owner: ${owner}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Target"
          value={row.target?.toLocaleString("vi-VN") ?? "—"}
          hint={row.unit}
          accent="indigo"
        />
        <KpiCard
          label="Thực tế"
          value={row.actual?.toLocaleString("vi-VN") ?? "—"}
          hint={row.unit}
          accent="violet"
        />
        <KpiCard
          label="Completion"
          value={row.completion != null ? `${Math.round(row.completion * 100)}%` : "—"}
          accent={row.status === "green" ? "emerald" : row.status === "yellow" ? "amber" : "red"}
        />
        <KpiCard label="Data source" value={row.data_source ?? "—"} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin KPI</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row k="Mô tả" v={row.description ?? "—"} />
            <Row k="Cấp độ" v={<Badge variant="outline">{row.level}</Badge>} />
            <Row k="Tần suất" v={row.target_frequency} />
            <Row k="Trọng số" v={row.weight.toFixed(2)} />
            <Row k="KPI cha" v={parent ? <Link href={`/kpi/${parent.id}`} className="text-indigo-600">{parent.name}</Link> : "—"} />
            <Row k="Số KPI con" v={String(children.length)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threshold</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Đỏ (&lt; 85%)
              </span>
              <span className="text-zinc-500">dưới 85% target</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Vàng (85–100%)
              </span>
              <span className="text-zinc-500">đang theo dõi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Xanh (&ge; 100%)
              </span>
              <span className="text-zinc-500">đạt target</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KPI con</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={childColumns} rows={children} empty="KPI này không có KPI con" />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{k}</span>
      <span className="text-zinc-900">{v}</span>
    </div>
  );
}
