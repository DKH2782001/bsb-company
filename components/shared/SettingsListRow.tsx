import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SettingsListRow({
  icon,
  title,
  hint,
  action,
  status,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: string;
  status?: "success" | "warning" | "danger" | "info" | "outline";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] border border-[var(--line-soft)] bg-white px-4 py-3.5 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--brand-600)]">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--text-strong)]">{title}</div>
        {hint && <div className="mt-0.5 text-xs text-[var(--text-soft)]">{hint}</div>}
      </div>
      {status && <Badge variant={status}>{action ?? "Đang hoạt động"}</Badge>}
      {!status && action && (
        <div className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)]">
          <span>{action}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
