import { ArrowLeft, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteHolidayAction, deleteLeaveTypeAction } from "../actions";
import { HolidayDialog } from "@/components/leave/HolidayDialog";
import { ImportHolidaysButton } from "@/components/leave/ImportHolidaysButton";
import { LeaveTypeDialog } from "@/components/leave/LeaveTypeDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaveSettings } from "@/lib/repositories/leave";
import { formatDateVN } from "@/lib/utils";

export default async function LeaveSettingsPage() {
  const data = await getLeaveSettings();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cấu hình nghỉ phép"
        description="Trang chủ > Nghỉ phép > Cấu hình"
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Loại nghỉ phép</CardTitle>
            <LeaveTypeDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Thêm loại nghỉ
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.types.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Chưa có loại nghỉ phép. Thêm loại đầu tiên để nhân viên có thể submit đơn.</div>
          ) : (
            <div className="space-y-2">
              {data.types.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line-soft)] p-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-[var(--text-strong)]">{t.name}</div>
                      <Badge variant="outline">{t.code}</Badge>
                      <Badge variant={t.paid ? "success" : "outline"}>{t.paid ? "Có lương" : "Không lương"}</Badge>
                      {t.requires_attachment && <Badge variant="info">Cần tài liệu</Badge>}
                      <Badge variant={t.active ? "success" : "outline"}>{t.active ? "Hoạt động" : "Tắt"}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      {t.default_quota_days != null ? `Quota ${t.default_quota_days} ngày/năm · ` : ""}
                      Carry-over tối đa {t.carry_over_max_days} ngày
                    </div>
                    {t.description && <div className="mt-1 text-xs text-[var(--text-soft)]">{t.description}</div>}
                  </div>
                  <div className="flex gap-1">
                    <LeaveTypeDialog
                      initial={t}
                      trigger={
                        <Button type="button" variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <form action={deleteLeaveTypeAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Ngày lễ</CardTitle>
            <div className="flex items-center gap-2">
              <ImportHolidaysButton />
              <HolidayDialog
                trigger={
                  <Button size="sm">
                    <CalendarDays className="h-4 w-4" />
                    Thêm ngày lễ
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.holidays.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Chưa có ngày lễ. Bấm "Import lịch lễ VN" để thêm 6 ngày lễ chính thức theo Bộ luật LĐ 2019.</div>
          ) : (
            <div className="space-y-2">
              {data.holidays.map((h) => (
                <div key={h.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line-soft)] p-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-[var(--text-strong)]">{h.name}</div>
                      <span className="text-xs text-[var(--text-soft)]">{formatDateVN(h.holiday_date)}</span>
                      <Badge variant={h.is_paid ? "success" : "outline"}>{h.is_paid ? "Có lương" : "Không lương"}</Badge>
                      {h.is_substitute && <Badge variant="info">Nghỉ bù</Badge>}
                      {h.company_id == null && <Badge variant="outline">Toàn quốc</Badge>}
                    </div>
                    {h.notes && <div className="mt-1 text-xs text-[var(--text-soft)]">{h.notes}</div>}
                  </div>
                  <div className="flex gap-1">
                    <HolidayDialog
                      initial={h}
                      trigger={
                        <Button type="button" variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <form action={deleteHolidayAction}>
                      <input type="hidden" name="id" value={h.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
