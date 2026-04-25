import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProgressList } from "@/components/widgets/ProgressList";
import { StatChip } from "@/components/widgets/StatChip";
import { fetchReports, fetchReportSchedules } from "@/lib/queries";
import { FileText, Download, Calendar, Mail, Clock, FileSpreadsheet, Sparkles } from "lucide-react";

export const revalidate = 300;

export default async function ReportsPage() {
  const { t } = await tServer();
  const [reportsRaw, schedulesRaw] = await Promise.all([fetchReports(), fetchReportSchedules()]);

  const reports = reportsRaw.map((report) => {
    const payload = typeof report.payload === "object" && report.payload ? report.payload as Record<string, unknown> : {};
    return {
      id: report.id,
      title: String(payload.title ?? `${report.kind} · ${report.period}`),
      kind: report.kind,
      period: report.period,
      generated_at: report.generated_at,
      size: String(payload.size ?? "—"),
      format: String(payload.format ?? "PDF"),
      downloads: Number(payload.downloads ?? 0),
    };
  });

  const schedules = schedulesRaw.map((schedule) => ({
    id: schedule.id,
    kind: schedule.kind,
    cron: schedule.cron,
    next: schedule.cron,
    recipients: Array.isArray(schedule.recipients) ? schedule.recipients.length : 0,
  }));

  const columns: Column<(typeof reports)[number]>[] = [
    {
      key: "title",
      header: "Báo cáo",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${r.format === "XLSX" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>
            {r.format === "XLSX" ? <FileSpreadsheet className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-medium text-zinc-900">{r.title}</div>
            <div className="text-xs text-zinc-500">
              {r.period} · {r.size} · {r.downloads} lượt tải
            </div>
          </div>
        </div>
      ),
    },
    { key: "format", header: "Định dạng", render: (r) => <Badge variant="outline">{r.format}</Badge> },
    {
      key: "gen",
      header: "Tạo lúc",
      render: (r) => (
        <span className="text-xs text-zinc-500">
          {new Date(r.generated_at).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      key: "act",
      header: "",
      align: "right",
      render: () => (
        <Button size="sm" variant="outline">
          <Download className="h-3.5 w-3.5" /> Tải
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        helpKey="/reports"
        title={t("reports.title")}
        description={t("reports.subtitle")}
        actions={<Button>{t("reports.new")}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Báo cáo" value={String(reports.length)} accent="indigo" icon={<FileText className="h-3.5 w-3.5" />} />
        <KpiCard label="Lịch gửi" value={String(schedules.length)} accent="violet" icon={<Calendar className="h-3.5 w-3.5" />} />
        <KpiCard label="Lượt tải tháng" value={String(reports.reduce((s, r) => s + r.downloads, 0))} accent="emerald" />
        <KpiCard label="Recipients" value={String(schedules.reduce((s, r) => s + r.recipients, 0))} accent="amber" icon={<Mail className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Báo cáo đã tạo</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={reports} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lịch gửi tự động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3">
                <Calendar className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 text-sm truncate">{s.kind}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {s.next}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {s.recipients} người nhận
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Báo cáo phổ biến (downloads)</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={reports
                .slice()
                .sort((a, b) => b.downloads - a.downloads)
                .slice(0, 5)
                .map((r) => ({
                  label: r.title,
                  value: r.downloads,
                  max: Math.max(...reports.map((x) => x.downloads)),
                  right: `${r.downloads} lượt`,
                  color: "#6366f1",
                }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Gợi ý báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="Weekly KPI (CEO)" value="tạo ngay" tone="info" />
            <StatChip label="Burn / Runway (CFO)" value="tạo ngay" tone="warning" />
            <StatChip label="Recruiting Q2" value="tạo ngay" tone="violet" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatChip label="PDF" value={reports.filter((r) => r.format === "PDF").length} tone="info" />
            <StatChip label="XLSX" value={reports.filter((r) => r.format === "XLSX").length} tone="success" />
            <StatChip label="CSV" value={0} tone="default" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
