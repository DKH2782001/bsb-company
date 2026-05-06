"use client";

import { useState, useTransition } from "react";
import { assignShiftAction } from "../actions";
import type { SchedulingTemplate } from "../_lib/types";

type Props = {
  employeeId: string;
  date: string;
  weekStart: string;
  templates: SchedulingTemplate[];
};

export function AssignShiftCell({ employeeId, date, weekStart, templates }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const assign = (templateId: string) => {
    const fd = new FormData();
    fd.set("week_start", weekStart);
    fd.set("template_id", templateId);
    fd.set("employee_id", employeeId);
    fd.set("shift_date", date);
    startTransition(async () => {
      const result = await assignShiftAction(fd);
      if (result.ok) {
        setError(null);
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="relative h-full min-h-12">
      <button
        className="w-full h-full min-h-12 grid place-items-center rounded-lg border border-dashed transition-colors hover:bg-[var(--surface-alt)]"
        style={{ color: "var(--text-soft)", borderColor: "var(--line-soft)" }}
        onClick={() => {
          setError(null);
          setOpen((v) => !v);
        }}
        disabled={pending}
        aria-label="Them ca"
      >
        {pending ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-1 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-lg border p-1 min-w-[150px]"
            style={{ background: "var(--surface)", borderColor: "var(--line-soft)" }}
          >
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 hover:bg-[var(--surface-alt)]"
                style={{ color: "var(--text-strong)" }}
                onClick={() => assign(tpl.id)}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tpl.color }} />
                {tpl.shortLabel ?? tpl.name}
              </button>
            ))}
            {error && <div className="mt-1 rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600">{error}</div>}
          </div>
        </>
      )}
    </div>
  );
}
