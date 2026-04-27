import Link from "next/link";
import { CalendarDays, ClipboardCheck, Settings, X } from "lucide-react";
import { cancelLeaveAction } from "./actions";
import { LeaveSubmitForm } from "@/components/leave/LeaveSubmitForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmployeeLeaveData, type LeaveRequest } from "@/lib/repositories/leave";
import { formatDateVN } from "@/lib/utils";

const statusBadge: Record<LeaveRequest["status"], { label: string; tone: "success" | "warning" | "danger" | "info" | "outline" }> = {
  draft: { label: "Nháp", tone: "outline" },
  pending: { label: "Chờ duyệt", tone: "warning" },
  approved: { label: "Đã duyệt", tone: "success" },
  rejected: { label: "Từ chối", tone: "danger" },
  cancelled: { label: "Đã huỷ", tone: "outline" },
};

export default async function LeavePage() {
  const data = await getEmployeeLeaveData();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nghỉ phép"
        description="Trang chủ > Nghỉ phép"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/leave/calendar">
              <Button variant="outline" size="sm">
                <CalendarDays className="h-4 w-4" />
                Lịch team
              </Button>
            </Link>
            <Link href="/leave/approvals">
              <Button variant="outline" size="sm">
                <ClipboardCheck className="h-4 w-4" />
                Duyệt đơn
              </Button>
            </Link>
            <Link href="/leave/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Cấu hình
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.leaveTypes
          .filter((t) => t.default_quota_days != null)
          .map((t) => {
            const balance = data.myBalances.find((b) => b.leave_type_id === t.id);
            const total = (balance?.entitled_days ?? t.default_quota_days ?? 0) + (balance?.carried_over_days ?? 0) + (balance?.adjustment_days ?? 0);
            const used = balance?.used_days ?? 0;
            const pending = balance?.pending_days ?? 0;
            const remaining = Math.max(0, total - used - pending);
            return (
              <Card key={t.id}>
                <CardContent className="pt-5">
                  <div className="text-xs font-medium text-[var(--text-soft)]">{t.name}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-[var(--text-strong)]">{remaining}</div>
                    <div className="text-xs text-[var(--text-soft)]">/ {total} ngày</div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-alt)]">
                    <div className="h-full bg-[var(--brand-600)]" style={{ width: `${total ? Math.min(100, (used / total) * 100) : 0}%` }} />
                  </div>
                  <div className="mt-2 text-[11px] text-[var(--text-soft)]">
                    Đã dùng {used} · Chờ duyệt {pending}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Gửi đơn nghỉ phép</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveSubmitForm leaveTypes={data.leaveTypes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ngày lễ sắp tới</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingHolidays.length === 0 ? (
              <div className="text-sm text-[var(--text-soft)]">Chưa có ngày lễ nào sắp tới.</div>
            ) : (
              <ul className="space-y-2">
                {data.upcomingHolidays.map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line-soft)] p-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-strong)]">{h.name}</div>
                      <div className="mt-0.5 text-xs text-[var(--text-soft)]">{formatDateVN(h.holiday_date)}</div>
                      {h.notes && <div className="mt-0.5 text-[11px] text-[var(--text-soft)]">{h.notes}</div>}
                    </div>
                    <Badge variant={h.is_paid ? "success" : "outline"}>{h.is_paid ? "Có lương" : "Không lương"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đơn nghỉ phép</CardTitle>
        </CardHeader>
        <CardContent>
          {data.myRequests.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Chưa có đơn nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase text-[var(--text-soft)]">
                    <th className="pb-3 pr-4">Loại</th>
                    <th className="pb-3 pr-4">Từ</th>
                    <th className="pb-3 pr-4">Đến</th>
                    <th className="pb-3 pr-4">Số ngày</th>
                    <th className="pb-3 pr-4">Lý do</th>
                    <th className="pb-3 pr-4">Trạng thái</th>
                    <th className="pb-3 pr-4">Ghi chú duyệt</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {data.myRequests.map((r) => {
                    const s = statusBadge[r.status];
                    return (
                      <tr key={r.id}>
                        <td className="py-3 pr-4 font-medium text-[var(--text-strong)]">{r.leave_type_name}</td>
                        <td className="py-3 pr-4">{formatDateVN(r.starts_on)}</td>
                        <td className="py-3 pr-4">{formatDateVN(r.ends_on)}</td>
                        <td className="py-3 pr-4">{r.total_days}</td>
                        <td className="py-3 pr-4 text-[var(--text-soft)]">{r.reason ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={s.tone}>{s.label}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-[var(--text-soft)]">{r.decision_note ?? "—"}</td>
                        <td className="py-3">
                          {r.status === "pending" && (
                            <form action={cancelLeaveAction}>
                              <input type="hidden" name="requestId" value={r.id} />
                              <Button type="submit" variant="ghost" size="sm">
                                <X className="h-3.5 w-3.5 text-red-500" />
                                Huỷ
                              </Button>
                            </form>
                          )}
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
