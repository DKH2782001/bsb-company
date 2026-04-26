"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export type MultiSelectOption = {
  value: string;
  label: string;
  swatch?: string;
};

type Props = {
  placeholder: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  className?: string;
};

export function MultiSelect({ placeholder, options, values, onChange, searchable = true, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function toggle(v: string) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }

  function selectAll() {
    onChange(filtered.map((o) => o.value));
  }
  function clearAll() {
    onChange([]);
  }

  const summary = values.length === 0
    ? placeholder
    : values.length === 1
      ? options.find((o) => o.value === values[0])?.label ?? placeholder
      : `${options.find((o) => o.value === values[0])?.label ?? ""}, +${values.length - 1}`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 h-9 rounded-lg border bg-white px-3 text-sm transition-colors ${values.length > 0 ? "border-indigo-300 text-indigo-700 bg-indigo-50/40" : "border-[var(--line-soft)] text-[var(--text-strong)]"}`}
      >
        <span className="truncate max-w-[160px]">{summary}</span>
        {values.length > 0 && (
          <span className="ml-0.5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
            {values.length}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-200 rounded-lg shadow-lg min-w-[200px] max-w-[280px]">
          {searchable && (
            <div className="p-2 border-b border-zinc-100">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full px-2 py-1.5 rounded-md border border-zinc-200 text-xs"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-[240px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-400">Không có kết quả</div>
            ) : filtered.map((o) => {
              const checked = values.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-50 text-left"
                >
                  <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${checked ? "bg-indigo-600 border-indigo-600 text-white" : "border-zinc-300"}`}>
                    {checked && <Check className="h-2.5 w-2.5" />}
                  </span>
                  {o.swatch && <span className={`h-2 w-2 rounded-full ${o.swatch}`} />}
                  <span className="flex-1 text-zinc-700">{o.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-100 text-[11px]">
            <button type="button" onClick={selectAll} className="text-indigo-600 hover:underline">Chọn tất cả</button>
            <button type="button" onClick={clearAll} className="text-zinc-500 hover:text-red-500 flex items-center gap-0.5">
              <X className="h-3 w-3" />Xoá chọn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
