import { hexToShiftToken } from "@/lib/color-mapping";
import { getTextColorForHex } from "@/lib/color-mapping";
import { formatTimeRange } from "../_lib/formatters";
import type { SchedulingTemplate } from "../_lib/types";

type Props = {
  template: SchedulingTemplate;
  isOverHoursShift?: boolean;
};

export function ShiftBlock({ template, isOverHoursShift }: Props) {
  const token = hexToShiftToken(template.color);
  const timeLabel = formatTimeRange(template.startTime, template.endTime);

  if (isOverHoursShift) {
    return (
      <div className="shift-block shift-warn" title="Vượt giờ tối đa tuần">
        <svg
          className="w-3.5 h-3.5 flex-shrink-0 opacity-80"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <span className="font-semibold">{template.shortLabel}</span>
        <span
          className="ml-auto opacity-75"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10 }}
        >
          {timeLabel}
        </span>
      </div>
    );
  }

  if (token === "custom") {
    const textColor = getTextColorForHex(template.color);
    return (
      <div
        className="shift-block"
        style={{
          background: template.color + "22",
          borderLeftColor: template.color,
          color: textColor,
        }}
      >
        <span className="font-semibold">{template.shortLabel}</span>
        <span
          className="ml-auto opacity-75"
          style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10 }}
        >
          {timeLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={`shift-block shift-${token}`}>
      <span className="font-semibold">{template.shortLabel}</span>
      <span
        className="ml-auto opacity-75"
        style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10 }}
      >
        {timeLabel}
      </span>
    </div>
  );
}
