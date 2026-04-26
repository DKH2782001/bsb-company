"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Task, Employee } from "@/types/domain";

type Props = {
  year: number;
  month: number;
  today: number;
  tasks: Task[];
  employees: Employee[];
};

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-zinc-400",
  in_progress: "bg-amber-500",
  review: "bg-violet-500",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
  cancelled: "bg-zinc-300",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  in_progress: "Đang làm",
  review: "Review",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

export function DeadlineCalendar({ year, month, today, tasks, employees }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const tasksByDay = new Map<number, Task[]>();
  for (const t of tasks) {
    if (!t.due_date) continue;
    const dt = new Date(t.due_date);
    if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month) continue;
    const day = dt.getDate();
    const arr = tasksByDay.get(day) ?? [];
    arr.push(t);
    tasksByDay.set(day, arr);
  }

  const dayTasks = selectedDay ? tasksByDay.get(selectedDay) ?? [] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-zinc-900">
          Tháng {String(month).padStart(2, "0")}/{year}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {labels.map((l) => (
          <div key={l} className="text-[10px] font-medium text-zinc-400 py-1">{l}</div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const isToday = d === today;
          const isSelected = d === selectedDay;
          const dayList = tasksByDay.get(d) ?? [];
          const hl = dayList.length > 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : d)}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-xs relative transition-colors",
                isSelected
                  ? "bg-indigo-600 text-white font-semibold ring-2 ring-indigo-300"
                  : isToday
                    ? "bg-indigo-600 text-white font-semibold"
                    : hl
                      ? "bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100"
                      : "text-zinc-700 hover:bg-zinc-100",
              )}
            >
              {d}
              {hl && !isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayList.length > 1 && <span className="text-[8px] text-indigo-500 font-bold">{dayList.length}</span>}
                  {dayList.length === 1 && <span className="h-1 w-1 rounded-full bg-indigo-500" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-zinc-100">
          <div className="text-xs font-medium text-zinc-700 mb-2">
            Deadline {String(selectedDay).padStart(2, "0")}/{String(month).padStart(2, "0")} — {dayTasks.length} task
          </div>
          {dayTasks.length === 0 ? (
            <div className="text-xs text-zinc-400 py-2">Không có task nào.</div>
          ) : (
            <ul className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {dayTasks.map((t) => {
                const emp = employees.find((e) => e.id === t.assignee_id);
                return (
                  <li key={t.id} className="flex items-start gap-2 text-xs">
                    <span className={cn("h-2 w-2 rounded-full mt-1 shrink-0", STATUS_COLOR[t.status] ?? "bg-zinc-400")} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-zinc-800 font-medium">{t.title}</div>
                      <div className="text-[10px] text-zinc-500 flex gap-2">
                        <span>{STATUS_LABEL[t.status] ?? t.status}</span>
                        {emp && <span>· {emp.full_name}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
