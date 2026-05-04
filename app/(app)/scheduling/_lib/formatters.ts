const VI_MONTHS = [
  "tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6",
  "tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12",
];
const VI_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function parseLocal(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

export function getDayLabel(dateStr: string): string {
  return VI_DAYS[parseLocal(dateStr).getDay()];
}

export function formatDateShort(dateStr: string): string {
  const d = parseLocal(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function isToday(dateStr: string): boolean {
  const d = new Date();
  return dateStr === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isWeekend(dateStr: string): boolean {
  const dow = parseLocal(dateStr).getDay();
  return dow === 0 || dow === 6;
}

export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = parseLocal(weekStart);
  const e = parseLocal(weekEnd);
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()} — ${e.getDate()} ${VI_MONTHS[e.getMonth()]}`;
  }
  return `${s.getDate()} ${VI_MONTHS[s.getMonth()]} — ${e.getDate()} ${VI_MONTHS[e.getMonth()]}`;
}

export function formatWeekSubLabel(weekStart: string, weekEnd: string): string {
  return `${formatDateShort(weekStart)} → ${formatDateShort(weekEnd)}`;
}

export function getISOWeekNumber(dateStr: string): number {
  const d = parseLocal(dateStr);
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return Math.ceil((dayOfYear + parseLocal(`${d.getFullYear()}-01-01`).getDay()) / 7);
}

export function formatVNDCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const sh = parseInt(startTime.split(":")[0]);
  const eh = parseInt(endTime.split(":")[0]);
  return `${sh}–${eh}h`;
}

export function addWeeks(dateStr: string, n: number): string {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + n * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatPublishedAgo(publishedAt: string): string {
  const diffMs = Date.now() - new Date(publishedAt).getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffH / 24);
  if (diffD === 0) return `${diffH}h trước`;
  if (diffD === 1) return "hôm qua";
  return `${diffD} ngày trước`;
}
