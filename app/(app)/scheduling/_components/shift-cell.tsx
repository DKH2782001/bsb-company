"use client";

import { useTransition } from "react";
import { removeShiftAction } from "../actions";
import { ShiftBlock } from "./shift-block";
import type { SchedulingTemplate } from "../_lib/types";

type Props = {
  shiftId: string;
  template: SchedulingTemplate;
  isOverHoursShift?: boolean;
};

export function ShiftCell({ shiftId, template, isOverHoursShift }: Props) {
  const [pending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      await removeShiftAction(shiftId);
    });
  };

  return (
    <div className="relative group" style={{ opacity: pending ? 0.5 : 1 }}>
      <ShiftBlock template={template} isOverHoursShift={isOverHoursShift} />
      <button
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full grid place-items-center z-10 opacity-0 group-hover:opacity-100 transition-opacity border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line-soft)",
          color: "var(--text-soft)",
        }}
        onClick={remove}
        disabled={pending}
        aria-label="Xóa ca"
        title="Xóa ca này"
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
