import Link from "next/link";
import { CalendarRange, Settings } from "lucide-react";
import { AttendanceCheckPanel } from "@/components/attendance/AttendanceCheckPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceMonth, type AttendanceRecord } from "@/lib/repositories/attendance";
import { formatDateVN } from "@/lib/utils";

const statusLabel: Record<
  AttendanceRecord["status"],
  { label: string; tone: "success" | "warning" | "danger" | "outline" | "info" }
> = {
  present: { label: "Đúng giờ", tone: "success" },
  late: { label: "Đi muộn", tone: "warning" },
  early_leave: { label: "Về sớm", tone: "warning" },
  absent: { label: "Vắng", tone: "danger" },
  on_leave: { label: "Nghỉ phép", tone: "info" },
  holiday: { label: "Ngày lễ", tone: "info" },
  remote: { label: "Remote", tone: "info" },
  incomplete: { label: "Chưa đủ", tone: "outline" },
};

const sourceLabel: Record<AttendanceRecord["source"], string> = {
  web: "Web",
  mobile: "Mobile",
  biometric: "Vân tay",
  manual: "Thủ công",
  import: "Import",
};

function formatHHMM(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number) {
  if (!minutes) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins.toString().padStart(2, "0")}`;
}

export default async function AttendancePage() {
  const data = await getAttendanceMonth();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Chấm công"
        description="Trang chủ > Chấm công"
        actions={
          <div className="flex gap-2">
            <Link href="/attendance/timesheets">
              <Button variant="outline" size="sm">
                <CalendarRange className="h-4 w-4" />
                Bảng công tháng
              </Button>
            </Link>
            <Link href="/attendance/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Cấu hình
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Chấm công hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceCheckPanel todayRecord={data.todayRecord} myShift={data.myShift} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng hợp tháng</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <SummaryBox label="Ngày làm" value={String(data.summary.workedDays)} />
            <SummaryBox label="Đi muộn" value={String(data.summary.lateDays)} tone="warning" />
            <SummaryBox label="Về sớm" value={String(data.summary.earlyLeaveDays)} tone="warning" />
            <SummaryBox label="Tổng giờ làm" value={formatDuration(data.summary.totalMinutes)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử chấm công tháng này</CardTitle>
        </CardHeader>
        <CardContent>
          {data.records.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">
              Chưa có dữ liệu chấm công tháng này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase text-[var(--text-soft)]">
                    <th className="pb-3 pr-4">Ngày</th>
                    <th className="pb-3 pr-4">Vào</th>
                    <th className="pb-3 pr-4">Ra</th>
                    <th className="pb-3 pr-4">Trễ / Sớm</th>
                    <th className="pb-3 pr-4">Số giờ</th>
                    <th className="pb-3 pr-4">Trạng thái</th>
                    <th className="pb-3 pr-4">Nguồn</th>
                    <th className="pb-3 pr-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {data.records.map((record) => {
                    const status = statusLabel[record.status];
                    return (
                      <tr key={record.id}>
                        <td className="py-3 pr-4 font-medium text-[var(--text-strong)]">
                          {formatDateVN(record.work_date)}
                        </td>
                        <td className="py-3 pr-4">{formatHHMM(record.check_in_at)}</td>
                        <td className="py-3 pr-4">{formatHHMM(record.check_out_at)}</td>
                        <td className="py-3 pr-4 text-[var(--text-soft)]">
                          {record.late_minutes > 0 ? `Trễ ${record.late_minutes}'` : ""}
                          {record.early_leave_minutes > 0 ? ` Sớm ${record.early_leave_minutes}'` : ""}
                          {!record.late_minutes && !record.early_leave_minutes ? "—" : ""}
                        </td>
                        <td className="py-3 pr-4">{formatDuration(record.worked_minutes)}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-soft)]">
                          {sourceLabel[record.source]}
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-soft)]">
                          {record.note ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-3">
      <div className="text-xs text-[var(--text-soft)]">{label}</div>
      <div
        className={`mt-1 text-xl font-bold ${
          tone === "warning" ? "text-amber-600" : "text-[var(--text-strong)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
