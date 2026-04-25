import { cn } from "@/lib/utils";

export function StatChip({
  label,
  value,
  tone = "default",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "violet";
  className?: string;
}) {
  const map = {
    default: "bg-zinc-50 text-zinc-700 ring-zinc-200/60",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 ring-amber-200/60",
    danger: "bg-red-50 text-red-700 ring-red-200/60",
    info: "bg-indigo-50 text-indigo-700 ring-indigo-200/60",
    violet: "bg-violet-50 text-violet-700 ring-violet-200/60",
  };
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg px-2.5 py-1.5 ring-1",
        map[tone],
        className,
      )}
    >
      <span className="text-[11px] font-medium">{label}</span>
      <span className="text-[13px] font-semibold">{value}</span>
    </div>
  );
}
