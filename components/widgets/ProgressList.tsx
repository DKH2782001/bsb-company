import { cn } from "@/lib/utils";

export type ProgressRow = {
  label: string;
  value: number;
  max?: number;
  right?: string;
  color?: string;
};

export function ProgressList({ rows, className }: { rows: ProgressRow[]; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {rows.map((r) => {
        const max = r.max ?? 100;
        const pct = max === 0 ? 0 : Math.min(100, Math.round((r.value / max) * 100));
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-zinc-700 truncate">{r.label}</span>
              <span className="text-zinc-500 text-xs shrink-0">
                {r.right ?? `${r.value}/${max}`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${pct}%`, background: r.color ?? "#6366f1" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
