"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiTreeGraph } from "@/components/kpi/KpiTreeGraphLazy";
import { DepartmentKpiSummary } from "./DepartmentKpiSummary";
import { KpiExecutionAlignment } from "./KpiExecutionAlignment";
import { KpiExecutionInsights } from "./KpiExecutionInsights";
import { ActionPlanList } from "./ActionPlanList";
import { ActionMetricCards } from "./ActionMetricCards";
import { EmployeeExecutionTable } from "./EmployeeExecutionTable";
import { LinkedTaskBoard } from "./LinkedTaskBoard";
import { KpiDetailDrawer } from "./KpiDetailDrawer";
import type { KpiExecutionPanel } from "@/lib/kpi/execution";
import type { KpiRow } from "@/lib/kpi/cascade";

export function KpiExecutionView({
  rows,
  panels,
}: {
  rows: KpiRow[];
  panels: KpiExecutionPanel[];
}) {
  const [selectedKpiId, setSelectedKpiId] = useState(
    panels.find((panel) => panel.kpi_id === "kpi_reviews_cskh_2026_04")?.kpi_id ??
      panels.find((panel) => panel.action_plans.length > 0)?.kpi_id ??
      panels[0]?.kpi_id ??
      "",
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedPanel = useMemo(
    () => panels.find((panel) => panel.kpi_id === selectedKpiId) ?? panels[0] ?? null,
    [selectedKpiId, panels],
  );

  const nodeMeta = useMemo(
    () =>
      Object.fromEntries(
        panels.map((panel) => [
          panel.kpi_id,
          {
            actionPlanCount: panel.node_meta.action_plan_count,
            taskCount: panel.node_meta.task_count,
            overdueTasks: panel.node_meta.overdue_task_count,
            blockedTasks: panel.node_meta.blocked_task_count,
            executionRisk: panel.node_meta.execution_risk,
          },
        ]),
      ),
    [panels],
  );

  if (!selectedPanel) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">KPI Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-6 text-sm text-indigo-900">
            KPI Tree dang trong. Bam nut Tao KPI o bang ben duoi de tao KPI dau tien, sau do chon KPI tren tree de quan tri Action Plan, Action Metric va Task.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="xl:sticky xl:top-4 xl:self-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">KPI Tree</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              KPI Tree là bản đồ mục tiêu tổng quan. Chọn một KPI để xem Action Plan, chỉ tiêu hành động và task đang phục vụ KPI này.
            </div>
            <KpiTreeGraph
              rows={rows}
              selectedId={selectedKpiId}
              onSelect={setSelectedKpiId}
              executionMetaByKpiId={nodeMeta}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">selectedKpiId = {selectedPanel.kpi_id}</Badge>
            <Badge variant="outline">{selectedPanel.node_meta.action_plan_count} action plans</Badge>
            <Badge variant="outline">{selectedPanel.node_meta.task_count} tasks</Badge>
            <Badge variant="warning">{selectedPanel.node_meta.overdue_task_count} overdue</Badge>
            <Badge variant="danger">{selectedPanel.node_meta.blocked_task_count} blocked</Badge>
          </div>

          <DepartmentKpiSummary panel={selectedPanel} onOpenDetail={() => setDrawerOpen(true)} />
          <ActionPlanList plans={selectedPanel.action_plans} linkedKpiId={selectedPanel.kpi_id} />
          <ActionMetricCards metrics={selectedPanel.linked_metrics} />
          <EmployeeExecutionTable rows={selectedPanel.personal_kpi_execution} />
          <LinkedTaskBoard tasks={selectedPanel.linked_tasks} />
          <KpiExecutionAlignment alignment={selectedPanel.alignment} />
          <KpiExecutionInsights insights={selectedPanel.insights} />
        </div>
      </div>

      <KpiDetailDrawer open={drawerOpen} panel={selectedPanel} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
