import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EnrichedLinkedTask } from "@/lib/kpi/execution";
import { formatExecutionPercent } from "./shared";

const TASK_STATUS_ORDER = ["todo", "in_progress", "review", "blocked", "done"] as const;

export function LinkedTaskBoard({ tasks }: { tasks: EnrichedLinkedTask[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Linked Task Board</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 lg:grid-cols-5">
          {TASK_STATUS_ORDER.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status);
            return (
              <div key={status} className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{status}</div>
                  <Badge variant="outline">{columnTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-white bg-white p-3 text-sm">
                      <div className="font-medium text-zinc-900">{task.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">{task.assignee_name}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="info">{task.linked_kpi_name}</Badge>
                        {task.linked_action_plan_title && <Badge variant="outline">{task.linked_action_plan_title}</Badge>}
                        {task.action_metric_name && <Badge variant="outline">{task.action_metric_name}</Badge>}
                      </div>
                      {(task.action_target_value ?? 0) > 0 && (
                        <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-xs text-zinc-700">
                          Progress: {(task.action_actual_value ?? 0).toLocaleString("vi-VN")} /{" "}
                          {(task.action_target_value ?? 0).toLocaleString("vi-VN")} {task.progress_unit ?? ""}
                          {task.action_completion != null && (
                            <span className="ml-1 font-semibold text-zinc-900">
                              ({formatExecutionPercent(task.action_completion)})
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>Due {task.due_date ?? "—"}</span>
                        <span>
                          SLA {task.sla_score ?? 0}% · Quality {task.quality_score ?? 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-400">
                      Không có task
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
