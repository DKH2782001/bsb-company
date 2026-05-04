type Props = {
  hours: number;
  maxHours: number;
  shiftCount: number;
  weeklyPay?: number;
};

export function HoursSummaryCell({ hours, maxHours, shiftCount, weeklyPay }: Props) {
  const isOver = hours > maxHours;
  const pct = Math.min(1, hours / maxHours);
  const isNearMax = !isOver && pct >= 0.9;

  const barColor = isOver ? "var(--sch-warn)" : isNearMax ? "var(--sch-ok)" : "var(--text-soft)";
  const textColor = isOver ? "var(--sch-warn)" : "var(--text-strong)";

  const overH = Math.round((hours - maxHours) * 10) / 10;

  let label: string;
  if (isOver) {
    label = `Vượt ${overH}h`;
  } else if (weeklyPay && weeklyPay > 0) {
    const compact = weeklyPay >= 1_000_000
      ? `${(weeklyPay / 1_000_000).toFixed(1)}tr`
      : `${Math.round(weeklyPay / 1_000)}k`;
    label = `${shiftCount} ca · ${compact}`;
  } else {
    label = `${shiftCount} ca`;
  }

  return (
    <div
      className="flex flex-col justify-center gap-1 px-3.5 py-2.5"
      style={{ background: "var(--surface-alt)" }}
    >
      <div
        className="flex items-baseline gap-1"
        style={{ fontFamily: "var(--font-jetbrains-mono)" }}
      >
        <span className="text-sm font-semibold" style={{ color: textColor }}>
          {hours}
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-soft)" }}>
          / {maxHours}h
        </span>
      </div>

      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "var(--line-soft)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct * 100}%`, background: barColor }}
        />
      </div>

      <span
        className="text-[10px] uppercase tracking-wide"
        style={{
          color: isOver ? "var(--sch-warn)" : "var(--text-soft)",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
