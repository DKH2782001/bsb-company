import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchEmployees } from "@/lib/queries";
import { queryAuditLogs, listAuditFacets, type AuditLogFilter } from "@/lib/repositories/governance";
import { History, Shield } from "lucide-react";
import type { AuditLog } from "@/types/domain";
import { AuditFilterBar } from "./AuditClient";

function toArr(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { t } = await tServer();
  const sp = await searchParams;

  const filter: AuditLogFilter = {
    search: typeof sp.search === "string" ? sp.search : "",
    actorIds: toArr(sp.actor),
    actions: toArr(sp.action),
    entities: toArr(sp.entity),
    from: typeof sp.from === "string" ? sp.from : null,
    to: typeof sp.to === "string" ? sp.to : null,
    page: sp.page ? Number(sp.page) || 1 : 1,
    pageSize: 50,
  };

  const [{ rows, total }, employees, facets] = await Promise.all([
    queryAuditLogs(filter),
    fetchEmployees(),
    listAuditFacets(),
  ]);

  type Row = AuditLog & { actor_name: string };
  const enriched: Row[] = rows.map((l) => ({
    ...l,
    actor_name: employees.find((e) => e.id === l.actor)?.full_name ?? (l.actor ?? "system"),
  }));

  // KPIs tính từ data đã filter (current page) — đủ cho tổng quan
  const byAction = Object.entries(
    enriched.reduce<Record<string, number>>((acc, r) => {
      acc[r.action] = (acc[r.action] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([action, count]) => ({ action, count }));

  const byActor = Object.entries(
    enriched.reduce<Record<string, number>>((acc, r) => {
      acc[r.actor_name] = (acc[r.actor_name] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([actor, count]) => ({ actor, count }));

  const withMeta = enriched.filter((r) => r.ip_address || r.user_agent).length;
  const withBeforeAfter = enriched.filter((r) => r.before && r.after).length;

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
          {r.entity}
          {r.entity_id ? `:${r.entity_id.slice(0, 8)}` : ""}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP / UA",
      render: (r) => (
        <div className="text-[10px] text-zinc-500 max-w-[180px]">
          <div className="font-mono">{r.ip_address ?? "—"}</div>
          {r.user_agent && <div className="truncate" title={r.user_agent}>{r.user_agent}</div>}
        </div>
      ),
    },
    {
      key: "before",
      header: "Before",
      render: (r) => (
        <details className="text-xs text-red-600 font-mono max-w-[200px]">
          <summary className="cursor-pointer">{r.before ? "xem" : "—"}</summary>
          {r.before && <pre className="whitespace-pre-wrap break-all">{JSON.stringify(r.before, null, 2)}</pre>}
        </details>
      ),
    },
    {
      key: "after",
      header: "After",
      render: (r) => (
        <details className="text-xs text-emerald-600 font-mono max-w-[200px]">
          <summary className="cursor-pointer">{r.after ? "xem" : "—"}</summary>
          {r.after && <pre className="whitespace-pre-wrap break-all">{JSON.stringify(r.after, null, 2)}</pre>}
        </details>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/audit"
        title={t("audit.title")}
        description={t("audit.subtitle")}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Bản ghi (filter)" value={String(total)} accent="indigo" icon={<History className="h-3.5 w-3.5" />} />
        <KpiCard label="Có IP/UA" value={`${withMeta}/${enriched.length}`} accent="emerald" />
        <KpiCard label="Có Before/After" value={`${withBeforeAfter}/${enriched.length}`} accent="violet" />
        <KpiCard label="Actors riêng" value={String(new Set(enriched.map((r) => r.actor_name)).size)} accent="amber" icon={<Shield className="h-3.5 w-3.5" />} />
      </div>

      <AuditFilterBar
        actions={facets.actions}
        entities={facets.entities}
        employees={employees.map((e) => ({ id: e.id, full_name: e.full_name }))}
        current={filter}
        total={total}
        page={filter.page ?? 1}
        pageSize={filter.pageSize ?? 50}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Action phổ biến (trang hiện tại)</CardTitle>
          </CardHeader>
          <CardContent>
            {byAction.length === 0 ? (
              <div className="text-xs text-zinc-400 py-4 text-center">Không có dữ liệu</div>
            ) : (
              <ProgressList
                rows={byAction.slice(0, 8).map((a) => ({
                  label: a.action,
                  value: a.count,
                  max: Math.max(...byAction.map((x) => x.count)),
                  right: `${a.count}`,
                  color: "#6366f1",
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Actor sửa nhiều (trang hiện tại)</CardTitle>
          </CardHeader>
          <CardContent>
            {byActor.length === 0 ? (
              <div className="text-xs text-zinc-400 py-4 text-center">Không có dữ liệu</div>
            ) : (
              <ProgressList
                rows={byActor.slice(0, 8).map((a) => ({
                  label: a.actor,
                  value: a.count,
                  max: Math.max(...byActor.map((x) => x.count)),
                  right: `${a.count}`,
                  color: "#8b5cf6",
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="% có IP/UA" value={enriched.length > 0 ? `${Math.round((withMeta / enriched.length) * 100)}%` : "—"} tone={withMeta === enriched.length && enriched.length > 0 ? "success" : "default"} />
            <StatChip label="Before/After pairs" value={`${withBeforeAfter}/${enriched.length}`} tone="info" />
            <StatChip label="Tổng records (toàn DB)" value={String(total)} tone="default" />
            <StatChip label="Retention" value="12 tháng" tone="default" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{enriched.length} bản ghi (trang {filter.page ?? 1})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={enriched} empty="Không có log khớp bộ lọc" />
        </CardContent>
      </Card>
    </div>
  );
}
