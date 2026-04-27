"use client";

import { useState, useTransition } from "react";
import { Clock, LogIn, LogOut, MapPin, Loader2 } from "lucide-react";
import { checkInAction, checkOutAction } from "@/app/(app)/attendance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateVN } from "@/lib/utils";
import type { AttendanceRecord, AttendanceShift } from "@/lib/repositories/attendance";

type Coords = { latitude: number; longitude: number; accuracy: number } | null;

const statusLabel: Record<AttendanceRecord["status"], { label: string; tone: "success" | "warning" | "danger" | "outline" | "info" }> = {
  present: { label: "Đúng giờ", tone: "success" },
  late: { label: "Đi muộn", tone: "warning" },
  early_leave: { label: "Về sớm", tone: "warning" },
  absent: { label: "Vắng", tone: "danger" },
  on_leave: { label: "Nghỉ phép", tone: "info" },
  holiday: { label: "Ngày lễ", tone: "info" },
  remote: { label: "Remote", tone: "info" },
  incomplete: { label: "Chưa đủ", tone: "outline" },
};

export function AttendanceCheckPanel({
  todayRecord,
  myShift,
}: {
  todayRecord: AttendanceRecord | null;
  myShift: AttendanceShift | null;
}) {
  const { toast } = useToast();
  const [coords, setCoords] = useState<Coords>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [coordsPending, setCoordsPending] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const hasCheckedIn = !!todayRecord?.check_in_at;
  const hasCheckedOut = !!todayRecord?.check_out_at;

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setCoordsError("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    setCoordsPending(true);
    setCoordsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setCoordsPending(false);
      },
      (err) => {
        setCoordsError(err.message || "Không lấy được vị trí.");
        setCoordsPending(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }

  function buildFormData() {
    const fd = new FormData();
    if (coords) {
      fd.set("latitude", String(coords.latitude));
      fd.set("longitude", String(coords.longitude));
    }
    if (note.trim()) fd.set("note", note.trim());
    return fd;
  }

  function submitCheckIn() {
    startTransition(async () => {
      const result = await checkInAction(buildFormData());
      if (!result.ok) {
        toast({ variant: "error", title: "Không thể chấm công", description: result.error });
        return;
      }
      toast({
        variant: "success",
        title: "Đã chấm công vào",
        description: result.locationName ? `Tại ${result.locationName}${result.lateMinutes > 0 ? ` · trễ ${result.lateMinutes} phút` : ""}` : undefined,
      });
      setNote("");
    });
  }

  function submitCheckOut() {
    startTransition(async () => {
      const result = await checkOutAction(buildFormData());
      if (!result.ok) {
        toast({ variant: "error", title: "Không thể chấm công ra", description: result.error });
        return;
      }
      const hours = Math.floor(result.workedMinutes / 60);
      const mins = result.workedMinutes % 60;
      toast({
        variant: "success",
        title: "Đã chấm công ra",
        description: `Tổng giờ làm: ${hours}h${mins.toString().padStart(2, "0")}${result.earlyLeaveMinutes > 0 ? ` · về sớm ${result.earlyLeaveMinutes} phút` : ""}`,
      });
      setNote("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <InfoBox
          icon={<Clock className="h-4 w-4" />}
          label="Ca làm hôm nay"
          value={myShift ? `${myShift.name} · ${myShift.start_time}–${myShift.end_time}` : "Chưa gán ca"}
        />
        <InfoBox
          icon={<LogIn className="h-4 w-4" />}
          label="Vào ca"
          value={todayRecord?.check_in_at ? new Date(todayRecord.check_in_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}
          hint={todayRecord?.late_minutes ? `Trễ ${todayRecord.late_minutes} phút` : undefined}
        />
        <InfoBox
          icon={<LogOut className="h-4 w-4" />}
          label="Tan ca"
          value={todayRecord?.check_out_at ? new Date(todayRecord.check_out_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}
          hint={todayRecord?.early_leave_minutes ? `Về sớm ${todayRecord.early_leave_minutes} phút` : undefined}
        />
      </div>

      <div className="rounded-[20px] border border-[var(--line-soft)] bg-white dark:bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--brand-600)]">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--text-strong)]">Vị trí GPS</div>
            <div className="mt-0.5 text-xs text-[var(--text-soft)]">
              {coords ? (
                <>
                  Lat {coords.latitude.toFixed(5)} · Lng {coords.longitude.toFixed(5)} · sai số ±{Math.round(coords.accuracy)}m
                </>
              ) : (
                "Chưa lấy vị trí. Bấm 'Lấy vị trí' để chấm công bằng GPS."
              )}
            </div>
            {coordsError && <div className="mt-1 text-xs text-red-500">{coordsError}</div>}
          </div>
          <Button type="button" variant="outline" size="sm" disabled={coordsPending} onClick={requestLocation}>
            {coordsPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            {coords ? "Cập nhật vị trí" : "Lấy vị trí"}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-soft)]">Ghi chú (tùy chọn)</label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Vd: tắc đường, ra ngoài làm việc..."
          className="mt-1"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={isPending || hasCheckedIn} onClick={submitCheckIn} className="min-w-[160px]">
          <LogIn className="h-4 w-4" />
          {hasCheckedIn ? "Đã chấm vào" : "Chấm công vào"}
        </Button>
        <Button type="button" variant="outline" disabled={isPending || !hasCheckedIn || hasCheckedOut} onClick={submitCheckOut} className="min-w-[160px]">
          <LogOut className="h-4 w-4" />
          {hasCheckedOut ? "Đã chấm ra" : "Chấm công ra"}
        </Button>

        {todayRecord && (
          <Badge variant={statusLabel[todayRecord.status].tone}>{statusLabel[todayRecord.status].label}</Badge>
        )}

        <span className="text-xs text-[var(--text-soft)]">{formatDateVN(new Date().toISOString())}</span>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line-soft)] bg-white dark:bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-[var(--text-soft)]">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1 text-base font-semibold text-[var(--text-strong)]">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-amber-600">{hint}</div>}
    </div>
  );
}
