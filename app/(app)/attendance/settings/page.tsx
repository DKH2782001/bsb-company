import { ArrowLeft, MapPin, Clock, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteLocationAction, deleteShiftAction } from "../actions";
import { LocationDialog } from "@/components/attendance/LocationDialog";
import { ShiftDialog } from "@/components/attendance/ShiftDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAttendanceSettings } from "@/lib/repositories/attendance";

export default async function AttendanceSettingsPage() {
  const data = await getAttendanceSettings();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cấu hình chấm công"
        description="Trang chủ > Chấm công > Cấu hình"
        actions={
          <Link href="/attendance">
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
            <CardTitle>Địa điểm chấm công</CardTitle>
            <LocationDialog
              trigger={
                <Button size="sm">
                  <MapPin className="h-4 w-4" />
                  Thêm địa điểm
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.locations.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Chưa có địa điểm. Hãy thêm văn phòng đầu tiên.</div>
          ) : (
            <div className="space-y-3">
              {data.locations.map((loc) => (
                <div key={loc.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line-soft)] p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[var(--text-strong)]">{loc.name}</div>
                      <Badge variant={loc.active ? "success" : "outline"}>{loc.active ? "Hoạt động" : "Tắt"}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">{loc.address ?? "Chưa có địa chỉ"}</div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      GPS: {loc.latitude != null ? `${loc.latitude.toFixed(5)}, ${loc.longitude?.toFixed(5)}` : "—"} · Bán kính {loc.radius_m}m
                    </div>
                    {loc.ip_whitelist.length > 0 && (
                      <div className="mt-1 text-xs text-[var(--text-soft)]">IP whitelist: {loc.ip_whitelist.join(", ")}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <LocationDialog
                      initial={loc}
                      trigger={
                        <Button type="button" variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <form action={deleteLocationAction}>
                      <input type="hidden" name="id" value={loc.id} />
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
          <div className="flex items-center justify-between">
            <CardTitle>Ca làm việc</CardTitle>
            <ShiftDialog
              trigger={
                <Button size="sm">
                  <Clock className="h-4 w-4" />
                  Thêm ca
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.shifts.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Chưa có ca làm. Hãy thêm ca đầu tiên (vd: hành chính 08:30–17:30).</div>
          ) : (
            <div className="space-y-3">
              {data.shifts.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line-soft)] p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[var(--text-strong)]">{s.name}</div>
                      <Badge variant="outline">{s.code}</Badge>
                      <Badge variant={s.active ? "success" : "outline"}>{s.active ? "Hoạt động" : "Tắt"}</Badge>
                      {s.is_overnight && <Badge variant="info">Qua đêm</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      {s.start_time}–{s.end_time} · Nghỉ trưa {s.break_minutes}' · Tha lỗi trễ {s.late_grace_minutes}' · Sớm {s.early_leave_grace_minutes}'
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ShiftDialog
                      initial={s}
                      trigger={
                        <Button type="button" variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <form action={deleteShiftAction}>
                      <input type="hidden" name="id" value={s.id} />
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
