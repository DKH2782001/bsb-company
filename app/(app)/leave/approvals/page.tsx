import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DecisionButtons } from "@/components/leave/DecisionButtons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApprovalQueue } from "@/lib/repositories/leave";
import { formatDateVN } from "@/lib/utils";

export default async function LeaveApprovalsPage() {
  const data = await getApprovalQueue();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Duyệt đơn nghỉ phép"
        description="Trang chủ > Nghỉ phép > Duyệt đơn"
        actions={
          <Link href="/leave">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Đơn đang chờ duyệt</CardTitle>
            <Badge variant="warning">{data.pending.length} đơn</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.pending.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Không có đơn nào cần duyệt.</div>
          ) : (
            <div className="space-y-3">
              {data.pending.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[var(--line-soft)] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-semibold text-[var(--text-strong)]">{r.employee_name ?? r.employee_id}</div>
                    <Badge variant="info">{r.leave_type_name}</Badge>
                    <Badge variant={r.leave_type_paid ? "success" : "outline"}>{r.leave_type_paid ? "Có lương" : "Không lương"}</Badge>
                    <span className="text-xs text-[var(--text-soft)]">Gửi {formatDateVN(r.created_at)}</span>
                  </div>
                  <div className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
                    <Info label="Từ ngày" value={formatDateVN(r.starts_on)} />
                    <Info label="Đến ngày" value={formatDateVN(r.ends_on)} />
                    <Info label="Số ngày" value={`${r.total_days} ngày làm việc`} />
                  </div>
                  {r.reason && (
                    <div className="mt-2 rounded-xl bg-[var(--surface-alt)] p-3 text-sm">
                      <span className="text-xs text-[var(--text-soft)]">Lý do: </span>
                      {r.reason}
                    </div>
                  )}
                  {r.handover_to && (
                    <div className="mt-2 text-xs text-[var(--text-soft)]">Bàn giao: {r.handover_to}</div>
                  )}
                  <div className="mt-3">
                    <DecisionButtons requestId={r.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử duyệt gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentlyDecided.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Chưa có lịch sử.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase text-[var(--text-soft)]">
                    <th className="pb-3 pr-4">Nhân viên</th>
                    <th className="pb-3 pr-4">Loại</th>
                    <th className="pb-3 pr-4">Khoảng nghỉ</th>
                    <th className="pb-3 pr-4">Số ngày</th>
                    <th className="pb-3 pr-4">Trạng thái</th>
                    <th className="pb-3 pr-4">Quyết định</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {data.recentlyDecided.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 font-medium text-[var(--text-strong)]">{r.employee_name ?? r.employee_id}</td>
                      <td className="py-3 pr-4">{r.leave_type_name}</td>
                      <td className="py-3 pr-4">{formatDateVN(r.starts_on)} → {formatDateVN(r.ends_on)}</td>
                      <td className="py-3 pr-4">{r.total_days}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={r.status === "approved" ? "success" : "danger"}>{r.status === "approved" ? "Đã duyệt" : "Từ chối"}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-soft)]">
                        {r.decided_at ? formatDateVN(r.decided_at) : "—"}
                        {r.decision_note && <div className="text-[11px]">{r.decision_note}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-alt)] p-2.5">
      <div className="text-[11px] text-[var(--text-soft)]">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-[var(--text-strong)]">{value}</div>
    </div>
  );
}
