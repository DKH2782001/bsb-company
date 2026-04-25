import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniSpark } from "@/components/charts/MiniSpark";

export function InsightCard({
  title,
  description,
  spark,
  accent = "#6366f1",
  tag,
}: {
  title: string;
  description: string;
  spark?: number[];
  accent?: string;
  tag?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 flex gap-3">
      <div
        className={cn(
          "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center",
        )}
        style={{ background: `${accent}1a`, color: accent }}
      >
        <ArrowUpRight className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm text-zinc-900 leading-tight">{title}</div>
          {tag && (
            <span
              className="text-[10px] font-medium rounded-full px-1.5 py-0.5 shrink-0"
              style={{ background: `${accent}1a`, color: accent }}
            >
              {tag}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
        {spark && spark.length > 1 && (
          <div className="mt-2 -mx-1">
            <MiniSpark data={spark} color={accent} height={32} />
          </div>
        )}
      </div>
    </div>
  );
}
