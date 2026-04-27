import Link from "next/link";
import { ArrowLeft, Lock, LockOpen, RefreshCw } from "lucide-react";
import {
  regenerateAttendanceTimesheetAction,
  saveAttendanceTimesheetRowAction,
  setAttendanceTimesheetLockAction,
} from "@/app/(app)/attendance/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceTimesheetMonth } from "@/lib/repositories/attendance-timesheets";

function monthLabel(month: string) {
  const [year, value] = month.split("-");
  return `Tháng ${value}/${year}`;
}

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

function formatDays(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

export default async function AttendanceTimesheetsPage(props: {
  searchParams: Promise<{ month?: string }>;
}) {
  const searchParams = await props.searchParams;
  const data = await getAttendanceTimesheetMonth(searchParams.month);
  const regenerateAction = async (formData: FormData) => {
    "use server";
    await regenerateAttendanceTimesheetAction(formData);
  };
  const toggleLockAction = async (formData: FormData) => {
    "use server";
    await setAttendanceTimesheetLockAction(formData);
  };
  const saveRowAction = async (formData: FormData) => {
    "use server";
    await saveAttendanceTimesheetRowAction(formData);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bảng công cuối tháng"
        description="Trang chủ > Chấm công > Bảng công tháng"
        actions={
          <Link href="/attendance">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại chấm công
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{monthLabel(data.month)}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
                <Badge variant={data.period.status === "locked" ? "warning" : "success"}>
                  {data.period.status === "locked" ? "Đã khóa" : "Đang mở"}
                </Badge>
                <span>Tổng hợp tự động từ attendance, nghỉ phép và OT.</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action="" method="get" className="flex items-center gap-2">
                <input
                  type="month"
                  name="month"
                  defaultValue={data.month}
                  className="h-10 rounded-2xl border border-[var(--line-soft)] bg-white px-3 text-sm text-[var(--text-strong)]"
                />
                <Button type="submit" variant="outline" size="sm">
                  Xem tháng
                </Button>
              </form>
              <form action={regenerateAction}>
                <input type="hidden" name="month" value={data.month} />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={!data.canManage || data.period.status === "locked"}
                >
                  <RefreshCw className="h-4 w-4" />
                  Tổng hợp lại
                </Button>
              </form>
              <form action={toggleLockAction}>
                <input type="hidden" name="month" value={data.month} />
                <input
                  type="hidden"
                  name="locked"
                  value={data.period.status === "locked" ? "false" : "true"}
                />
                <Button type="submit" size="sm" disabled={!data.canManage}>
                  {data.period.status === "locked" ? (
                    <LockOpen className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {data.period.status === "locked" ? "Mở khóa" : "Chốt bảng công"}
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <SummaryBox label="Nhân sự" value={String(data.summary.employees)} />
          <SummaryBox label="Ngày làm" value={formatDays(data.summary.workedDays)} />
          <SummaryBox label="Nghỉ lương" value={formatDays(data.summary.paidLeaveDays)} />
          <SummaryBox
            label="Nghỉ không lương"
            value={formatDays(data.summary.unpaidLeaveDays)}
            tone="warning"
          />
          <SummaryBox label="OT" value={formatHours(data.summary.overtimeHours)} />
          <SummaryBox label="Đi muộn" value={String(data.summary.lateDays)} tone="warning" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết nhân sự</CardTitle>
        </CardHeader>
        <CardContent>
          {data.rows.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">
              Chưa có dữ liệu nhân sự cho kỳ này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1380px] text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase text-[var(--text-soft)]">
                    <th className="pb-3 pr-4">Nhân sự</th>
                    <th className="pb-3 pr-4">Phòng ban</th>
                    <th className="pb-3 pr-4">Ngày làm</th>
                    <th className="pb-3 pr-4">Nghỉ lương</th>
                    <th className="pb-3 pr-4">Nghỉ không lương</th>
                    <th className="pb-3 pr-4">Ngày lễ</th>
                    <th className="pb-3 pr-4">OT</th>
                    <th className="pb-3 pr-4">Đi muộn</th>
                    <th className="pb-3 pr-4">Về sớm</th>
                    <th className="pb-3 pr-4">Điều chỉnh thủ công</th>
                    <th className="pb-3 pr-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {data.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 pr-4 font-medium text-[var(--text-strong)]">
                        {row.employee_name}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-soft)]">
                        {row.department_name ?? "—"}
                      </td>
                      <td className="py-3 pr-4">{formatDays(row.total_worked_days)}</td>
                      <td className="py-3 pr-4">{formatDays(row.total_paid_leave_days)}</td>
                      <td className="py-3 pr-4">{formatDays(row.total_unpaid_leave_days)}</td>
                      <td className="py-3 pr-4">{formatDays(row.holiday_days)}</td>
                      <td className="py-3 pr-4">{formatHours(row.total_overtime_hours)}</td>
                      <td className="py-3 pr-4">
                        {row.late_days} lần · {row.late_minutes}’
                      </td>
                      <td className="py-3 pr-4">
                        {row.early_leave_days} lần · {row.early_leave_minutes}’
                      </td>
                      <td className="py-3 pr-4">
                        <form action={saveRowAction} className="grid min-w-[460px] grid-cols-2 gap-2">
                          <input type="hidden" name="rowId" value={row.id} />
                          <input type="hidden" name="month" value={data.month} />
                          <input
                            name="manualWorkedDaysAdjustment"
                            type="number"
                            step="0.5"
                            defaultValue={row.manual_worked_days_adjustment}
                            disabled={!data.canManage || data.period.status === "locked"}
                            className="h-9 rounded-xl border border-[var(--line-soft)] bg-white px-2 text-xs"
                            placeholder="+/- ngày làm"
                          />
                          <input
                            name="manualPaidLeaveAdjustment"
                            type="number"
                            step="0.5"
                            defaultValue={row.manual_paid_leave_adjustment}
                            disabled={!data.canManage || data.period.status === "locked"}
                            className="h-9 rounded-xl border border-[var(--line-soft)] bg-white px-2 text-xs"
                            placeholder="+/- nghỉ lương"
                          />
                          <input
                            name="manualUnpaidLeaveAdjustment"
                            type="number"
                            step="0.5"
                            defaultValue={row.manual_unpaid_leave_adjustment}
                            disabled={!data.canManage || data.period.status === "locked"}
                            className="h-9 rounded-xl border border-[var(--line-soft)] bg-white px-2 text-xs"
                            placeholder="+/- nghỉ không lương"
                          />
                          <input
                            name="manualOvertimeHoursAdjustment"
                            type="number"
                            step="0.5"
                            defaultValue={row.manual_overtime_hours_adjustment}
                            disabled={!data.canManage || data.period.status === "locked"}
                            className="h-9 rounded-xl border border-[var(--line-soft)] bg-white px-2 text-xs"
                            placeholder="+/- OT"
                          />
                          <input
                            name="manualNote"
                            defaultValue={row.manual_note ?? ""}
                            disabled={!data.canManage || data.period.status === "locked"}
                            className="col-span-2 h-9 rounded-xl border border-[var(--line-soft)] bg-white px-2 text-xs"
                            placeholder="Ghi chú payroll / lý do điều chỉnh"
                          />
                          <div className="col-span-2">
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={!data.canManage || data.period.status === "locked"}
                            >
                              Lưu điều chỉnh
                            </Button>
                          </div>
                        </form>
                      </td>
                      <td className="py-3 pr-4 text-xs text-[var(--text-soft)]">
                        {data.period.status === "locked"
                          ? "Đã khóa"
                          : data.canManage
                            ? "Cho phép chỉnh"
                            : "Chỉ xem"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-xs text-[var(--text-soft)]">
            Khi bảng công ở trạng thái mở, HR có thể chỉnh tay số ngày làm, ngày nghỉ và OT
            trước khi chốt payroll. Sau khi khóa, chỉ CEO/HR Admin mới được mở lại.
          </div>
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
