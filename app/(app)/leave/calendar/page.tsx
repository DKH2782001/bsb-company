import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCalendarData, type Holiday, type LeaveRequestWithMeta } from "@/lib/repositories/leave";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default async function LeaveCalendarPage(props: { searchParams: Promise<{ month?: string }> }) {
  const params = await props.searchParams;
  const monthParam = params.month ?? new Date().toISOString().slice(0, 7);
  const data = await getCalendarData(monthParam);

  const [year, month] = monthParam.split("-").map(Number);
  const cells = buildMonthGrid(year, month);

  const requestsByDate = groupByDate(data.requests);
  const holidaysByDate = new Map<string, Holiday>();
  for (const h of data.holidays) holidaysByDate.set(h.holiday_date, h);

  const prevMonth = shiftMonth(year, month, -1);
  const nextMonth = shiftMonth(year, month, 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lịch nghỉ phép team"
        description={`Trang chủ > Nghỉ phép > Lịch · ${monthLabel(year, month)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/leave/calendar?month=${prevMonth}`}>
              <Button variant="outline" size="sm">‹ Tháng trước</Button>
            </Link>
            <Link href={`/leave/calendar`}>
              <Button variant="outline" size="sm">Tháng này</Button>
            </Link>
            <Link href={`/leave/calendar?month=${nextMonth}`}>
              <Button variant="outline" size="sm">Tháng sau ›</Button>
            </Link>
            <Link href="/leave">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{monthLabel(year, month)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 text-xs">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="pb-2 text-center font-semibold text-[var(--text-soft)]">{d}</div>
            ))}
            {cells.map((cell) => {
              if (!cell) return <div key={Math.random()} className="min-h-[88px] rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-alt)]/30" />;
              const iso = cell.iso;
              const holiday = holidaysByDate.get(iso);
              const reqs = requestsByDate.get(iso) ?? [];
              const isWeekend = cell.weekday === 5 || cell.weekday === 6;
              return (
                <div
                  key={iso}
                  className={`min-h-[88px] rounded-2xl border p-1.5 ${
                    holiday
                      ? "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
                      : isWeekend
                        ? "border-[var(--line-soft)] bg-[var(--surface-alt)]/40"
                        : "border-[var(--line-soft)] bg-white dark:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-xs font-bold ${holiday ? "text-rose-600" : "text-[var(--text-strong)]"}`}>{cell.day}</div>
                    {holiday && <span className="text-[10px] text-rose-600">Lễ</span>}
                  </div>
                  {holiday && (
                    <div className="mt-1 truncate rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                      {holiday.name}
                    </div>
                  )}
                  {reqs.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className={`mt-1 truncate rounded-md px-1.5 py-0.5 text-[10px] ${
                        r.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                      }`}
                      title={`${r.employee_name ?? r.employee_id} - ${r.leave_type_name} (${r.status})`}
                    >
                      {r.employee_name ?? r.employee_id}
                    </div>
                  ))}
                  {reqs.length > 3 && (
                    <div className="mt-1 text-[10px] text-[var(--text-soft)]">+{reqs.length - 3} người</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-soft)]">
            <Legend className="bg-emerald-100 text-emerald-700" label="Nghỉ phép đã duyệt" />
            <Legend className="bg-amber-100 text-amber-700" label="Đang chờ duyệt" />
            <Legend className="bg-rose-100 text-rose-700" label="Ngày lễ" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết đơn trong tháng ({data.requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.requests.length === 0 ? (
            <div className="text-sm text-[var(--text-soft)]">Tháng này chưa có đơn nghỉ phép.</div>
          ) : (
            <div className="space-y-2">
              {data.requests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line-soft)] p-3 text-sm">
                  <div className="font-semibold">{r.employee_name ?? r.employee_id}</div>
                  <Badge variant="info">{r.leave_type_name}</Badge>
                  <Badge variant={r.status === "approved" ? "success" : "warning"}>{r.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}</Badge>
                  <span className="text-[var(--text-soft)]">
                    {r.starts_on} → {r.ends_on} ({r.total_days} ngày)
                  </span>
                  {r.reason && <span className="text-[var(--text-soft)]">· {r.reason}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-md ${className}`} />
      <span>{label}</span>
    </div>
  );
}

function monthLabel(year: number, month: number) {
  return `Tháng ${String(month).padStart(2, "0")}/${year}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Convert Sunday=0 → 6, Monday=1 → 0
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const cells: Array<{ day: number; iso: string; weekday: number } | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = (new Date(year, month - 1, d).getDay() + 6) % 7;
    cells.push({ day: d, iso, weekday });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function groupByDate(requests: LeaveRequestWithMeta[]) {
  const map = new Map<string, LeaveRequestWithMeta[]>();
  for (const r of requests) {
    const start = new Date(r.starts_on);
    const end = new Date(r.ends_on);
    const cursor = new Date(start);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso)!.push(r);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return map;
}
