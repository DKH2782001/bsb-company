import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchAuditLogs, fetchEmployees } from "@/lib/queries";
import { History, Shield, Download, Filter } from "lucide-react";
import type { AuditLog } from "@/types/domain";

export default async function AuditPage() {
  const { t } = await tServer();
  const [logs, employees] = await Promise.all([fetchAuditLogs(), fetchEmployees()]);

  type Row = AuditLog & { actor_name: string };
  const rows: Row[] = logs.map((l) => ({
    ...l,
    actor_name: employees.find((e) => e.id === l.actor)?.full_name ?? (l.actor ?? "system"),
  }));

  const byAction = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.action] = (acc[r.action] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([action, count]) => ({ action, count }));

  const byActor = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.actor_name] = (acc[r.actor_name] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([actor, count]) => ({ actor, count }));

  const columns: Column<Row>[] = [
    {
      key: "time",
      header: "Thời gian",
      render: (r) => (
        <span className="font-mono text-xs whitespace-nowrap">
          {new Date(r.created_at).toLocaleString("vi-VN")}
        </span>
      ),
    },
    { key: "actor", header: "Actor", render: (r) => r.actor_name },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <Badge variant="outline" className="font-mono">
          {r.action}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (r) => (
        <span className="text-xs text-zinc-500 font-mono">
          {r.entity}:{r.entity_id?.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "before",
      header: "Before",
      render: (r) => (
        <span className="text-xs text-red-600 font-mono">
          {r.before ? JSON.stringify(r.before) : "—"}
        </span>
      ),
    },
    {
      key: "after",
      header: "After",
      render: (r) => (
        <span className="text-xs text-emerald-600 font-mono">
          {r.after ? JSON.stringify(r.after) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/audit"
        title={t("audit.title")}
        description={t("audit.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" /> {t("common.filter")}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> {t("common.export")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Bản ghi" value={String(logs.length)} accent="indigo" icon={<History className="h-3.5 w-3.5" />} />
        <KpiCard label="Overrides payroll" value={String(rows.filter((r) => r.action.startsWith("payroll")).length)} accent="amber" />
        <KpiCard label="KPI changes" value={String(rows.filter((r) => r.action.startsWith("kpi")).length)} accent="violet" />
        <KpiCard label="Actors" value={String(new Set(rows.map((r) => r.actor_name)).size)} accent="emerald" icon={<Shield className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Action phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={byAction.map((a) => ({
                label: a.action,
                value: a.count,
                max: Math.max(...byAction.map((x) => x.count)),
                right: `${a.count}`,
                color: "#6366f1",
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Actor sửa nhiều</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={byActor.map((a) => ({
                label: a.actor,
                value: a.count,
                max: Math.max(...byActor.map((x) => x.count)),
                right: `${a.count}`,
                color: "#8b5cf6",
              }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Log đầy đủ actor" value="100%" tone="success" />
            <StatChip label="Before/After pairs" value={`${rows.filter((r) => r.before && r.after).length}/${rows.length}`} tone="info" />
            <StatChip label="Retention" value="12 tháng" tone="default" />
            <StatChip label="Cần review" value="0" tone="success" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{logs.length} bản ghi gần nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={rows} empty="Chưa có log" />
        </CardContent>
      </Card>
    </div>
  );
}
