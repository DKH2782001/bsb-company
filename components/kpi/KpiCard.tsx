import { TrendingUp, TrendingDown } from "lucide-react";
import { MiniSpark } from "@/components/charts/MiniSpark";
import { cn } from "@/lib/utils";

export type Accent = "indigo" | "emerald" | "amber" | "red" | "violet" | "cyan" | "rose";

const ACCENT_HEX: Record<Accent, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  rose: "#f43f5e",
};

const ACCENT_BG: Record<Accent, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
  cyan: "bg-cyan-50 text-cyan-600",
  rose: "bg-rose-50 text-rose-600",
};

export function KpiCard({
  label,
  value,
  delta,
  accent = "indigo",
  hint,
  icon,
  spark,
}: {
  label: string;
  value: string;
  delta?: number;
  accent?: Accent;
  hint?: string;
  icon?: React.ReactNode;
  spark?: number[];
}) {
  const positive = typeof delta === "number" && delta >= 0;
  const color = ACCENT_HEX[accent];

  return (
    <div
      className={cn(
        "rounded-[26px] bg-white px-4.5 py-4",
        "shadow-[var(--shadow-card)]",
        "ring-1 ring-[var(--line-soft)]/90",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-soft)] whitespace-nowrap overflow-hidden">
          {icon && (
            <span
              className={cn(
                "h-8 w-8 rounded-2xl flex items-center justify-center shrink-0",
                ACCENT_BG[accent],
              )}
            >
              {icon}
            </span>
          )}
          <span className="truncate">{label}</span>
        </div>
        {typeof delta === "number" && (
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold",
              positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
            )}
          >
            {positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2 text-[28px] leading-8 font-bold tracking-tight text-[var(--text-strong)] whitespace-nowrap truncate">
        {value}
      </div>
      {hint && <div className="text-[11px] text-[var(--text-soft)] truncate mt-1">{hint}</div>}
      {spark && spark.length > 1 ? (
        <div className="-mx-1 mt-2">
          <MiniSpark data={spark} color={color} height={28} />
        </div>
      ) : (
        <div className="mt-3 h-[4px] w-full rounded-full bg-[var(--surface-alt)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(20, (delta ?? 40) + 50))}%`,
              background: color,
            }}
          />
        </div>
      )}
    </div>
  );
}
