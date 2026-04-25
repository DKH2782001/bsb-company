import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchAlerts } from "@/lib/queries";
import { resolveAlertAction } from "@/app/(app)/governance/actions";
import { AlertTriangle, AlertCircle, Info, AlertOctagon, BellRing, Clock, Shield } from "lucide-react";

const iconBy = {
  critical: AlertOctagon,
  danger: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

export default async function AlertsPage() {
  const { t } = await tServer();
  const alerts = await fetchAlerts();

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const danger = alerts.filter((a) => a.severity === "danger").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const info = alerts.filter((a) => a.severity === "info").length;

  const segments = [
    { name: "Critical", value: critical, color: "#dc2626" },
    { name: "Danger", value: danger, color: "#ef4444" },
    { name: "Warning", value: warning, color: "#f59e0b" },
    { name: "Info", value: info, color: "#6366f1" },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div>
      <PageHeader
        helpKey="/alerts"
        title={t("alerts.title")}
        description={t("alerts.subtitle")}
        actions={<Button variant="outline">{t("common.edit")} rule</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Critical" value={String(critical)} accent="red" icon={<AlertOctagon className="h-3.5 w-3.5" />} />
        <KpiCard label="Danger" value={String(danger)} accent="red" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
        <KpiCard label="Warning" value={String(warning)} accent="amber" icon={<AlertCircle className="h-3.5 w-3.5" />} />
        <KpiCard label="Info" value={String(info)} accent="indigo" icon={<Info className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Phân bổ mức độ</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiHeroDonut
              value={total}
              label="Tổng cảnh báo mở"
              height={200}
              segments={segments.map((s) => ({ ...s, value: (s.value / total) * 100 }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Theo nhóm nguyên nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="KPI threshold" value={2} tone="danger" />
            <StatChip label="Task overdue / SLA" value={1} tone="warning" />
            <StatChip label="Workload overload" value={1} tone="warning" />
            <StatChip label="Cash flow / Runway" value={1} tone="info" />
            <StatChip label="Compliance" value={0} tone="success" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              Rule đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { name: "KPI < 85% threshold", tone: "info" as const, count: "live" },
              { name: "Task overdue > 2 ngày", tone: "warning" as const, count: "live" },
              { name: "Chi phí vượt 5% budget", tone: "warning" as const, count: "live" },
              { name: "Nhân sự > 10 task", tone: "danger" as const, count: "live" },
              { name: "Cash < 10 tháng runway", tone: "info" as const, count: "live" },
            ].map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-2.5"
              >
                <span className="text-zinc-700">{r.name}</span>
                <Badge variant={r.tone}>{r.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BellRing className="h-4 w-4 text-indigo-600" />
            Cảnh báo đang mở ({alerts.length})
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="h-3.5 w-3.5" />
            Cập nhật liên tục
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.map((a) => {
            const Icon = iconBy[a.severity];
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50"
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    a.severity === "critical" || a.severity === "danger"
                      ? "bg-red-100 text-red-600"
                      : a.severity === "warning"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        a.severity === "critical" || a.severity === "danger"
                          ? "danger"
                          : a.severity === "warning"
                            ? "warning"
                            : "info"
                      }
                    >
                      {a.severity}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {new Date(a.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="font-medium text-zinc-900 mt-1">{a.title}</div>
                  <pre className="text-xs text-zinc-500 mt-1 font-mono">
                    {JSON.stringify(a.detail, null, 0)}
                  </pre>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" type="button">
                    Ẩn
                  </Button>
                  <form action={resolveAlertAction}>
                    <input type="hidden" name="alertId" value={a.id} />
                    <Button size="sm" type="submit">
                      Resolve
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
