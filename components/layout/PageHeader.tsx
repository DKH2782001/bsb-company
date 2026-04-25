import { cn } from "@/lib/utils";
import { HelpButton } from "./HelpButton";
import type { Locale } from "@/lib/i18n/dict";

export function PageHeader({
  title,
  description,
  actions,
  className,
  helpKey,
  locale,
  roles,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  helpKey?: string;
  locale?: Locale;
  roles?: string[];
}) {
  const hasTrailing = Boolean(actions) || Boolean(helpKey);
  return (
    <div className={cn("mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div>
        <h1 className="text-[31px] font-bold tracking-tight text-[var(--text-strong)]">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-[var(--text-soft)]">{description}</p>}
      </div>
      {hasTrailing && (
        <div className="flex items-center gap-2">
          {actions}
          {helpKey && <HelpButton helpKey={helpKey} locale={locale} roles={roles} />}
        </div>
      )}
    </div>
  );
}
