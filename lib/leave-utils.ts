// Pure helpers/types for leave — safe to import from client components.
// Không import gì từ next/headers hoặc các module chỉ chạy trên server.

export function calculateTotalDays(
  startsOn: string,
  endsOn: string,
  halfStart: boolean,
  halfEnd: boolean,
): number {
  const start = new Date(startsOn);
  const end = new Date(endsOn);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  if (halfStart && days > 0) days -= 0.5;
  if (halfEnd && days > 0) days -= 0.5;
  return Math.max(0, days);
}
