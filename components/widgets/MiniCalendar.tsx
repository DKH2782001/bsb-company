import { cn } from "@/lib/utils";

export function MiniCalendar({
  year = 2026,
  month = 4,
  highlights = [],
  today = 23,
}: {
  year?: number;
  month?: number;
  /** Days that should have a dot/highlight */
  highlights?: number[];
  today?: number;
}) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // make Monday first
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const highlightSet = new Set(highlights);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-zinc-900">
          Tháng {String(month).padStart(2, "0")}/{year}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {labels.map((l) => (
          <div key={l} className="text-[10px] font-medium text-zinc-400 py-1">
            {l}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const isToday = d === today;
          const hl = highlightSet.has(d);
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-xs relative",
                isToday
                  ? "bg-indigo-600 text-white font-semibold"
                  : hl
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-zinc-700 hover:bg-zinc-100",
              )}
            >
              {d}
              {hl && !isToday && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
