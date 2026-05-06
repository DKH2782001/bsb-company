"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { DepartmentKpiSummary } from "./DepartmentKpiSummary";
import { ActionPlanList } from "./ActionPlanList";
import { ActionMetricCards } from "./ActionMetricCards";
import { EmployeeExecutionTable } from "./EmployeeExecutionTable";
import { LinkedTaskBoard } from "./LinkedTaskBoard";
import { KpiExecutionInsights } from "./KpiExecutionInsights";
import type { KpiExecutionPanel } from "@/lib/kpi/execution";

const TABS = ["overview", "action-plans", "personal-kpi", "tasks", "insights"] as const;
type TabKey = (typeof TABS)[number];

export function KpiDetailDrawer({
  open,
  panel,
  onClose,
}: {
  open: boolean;
  panel: KpiExecutionPanel | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("overview");

  const taskStats = useMemo(() => {
    if (!panel) return { blocked: 0, overdue: 0 };
    return {
      blocked: panel.linked_tasks.filter((task) => task.status === "blocked").length,
      overdue: panel.linked_tasks.filter(
        (task) => task.status !== "done" && task.status !== "cancelled" && Boolean(task.due_date),
      ).length,
    };
  }, [panel]);

  return (
    <Sheet open={open} onClose={onClose} title={panel?.summary.name ?? "KPI Detail"} widthClass="w-full xl:w-[980px]">
      {!panel ? null : (
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === item ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-4">
              <DepartmentKpiSummary panel={panel} onOpenDetail={() => undefined} showDetailButton={false} />
              <ActionMetricCards metrics={panel.linked_metrics} />
            </div>
          )}

          {tab === "action-plans" && (
            <div className="space-y-4">
              <ActionPlanList plans={panel.action_plans} linkedKpiId={panel.kpi_id} />
              <ActionMetricCards metrics={panel.linked_metrics} />
            </div>
          )}

          {tab === "personal-kpi" && <EmployeeExecutionTable rows={panel.personal_kpi_execution} />}

          {tab === "tasks" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{panel.linked_tasks.length} linked tasks</Badge>
                <Badge variant="warning">{taskStats.overdue} overdue</Badge>
                <Badge variant="danger">{taskStats.blocked} blocked</Badge>
              </div>
              <LinkedTaskBoard tasks={panel.linked_tasks} />
            </div>
          )}

          {tab === "insights" && <KpiExecutionInsights insights={panel.insights} />}
        </div>
      )}
    </Sheet>
  );
}
