import { PageHeader } from "@/components/layout/PageHeader";
import { tServer } from "@/lib/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiHeroDonut } from "@/components/kpi/KpiHeroDonut";
import { MiniCalendar } from "@/components/widgets/MiniCalendar";
import { ActivityFeed } from "@/components/widgets/ActivityFeed";
import { ProgressList } from "@/components/widgets/ProgressList";
import {
  fetchActionMetrics,
  fetchActionPlans,
  fetchDepartmentResultKpis,
  fetchTasks,
  fetchEmployees,
  fetchKpis,
  fetchDepartments,
} from "@/lib/queries";
import { listKpiTargets } from "@/lib/repositories/kpi";
import { listSprints, listAllTaskResults } from "@/lib/repositories/operations";
import { getSprintMonth } from "@/lib/kpi/sprintAllocation";
import { createTaskFormAction } from "@/app/(app)/workspace/actions";
import { CheckCircle2, AlertTriangle, Target, ListChecks, Zap, Wrench, Plus, ChevronDown } from "lucide-react";
import { DeadlineCalendar } from "./DeadlineCalendar";
import { isTaskOverdue } from "./sprint-utils";
import { OperationsBoard } from "./OperationsBoard";
import { TaskExecutionInputs } from "./TaskExecutionInputs";

export default async function OperationsPage() {
  const { t } = await tServer();
  const [tasks, employees, kpis, departments, sprints, taskResults, resultKpis, actionPlans, actionMetrics] =
    await Promise.all([
      fetchTasks(),
      fetchEmployees(),
      fetchKpis(),
      fetchDepartments(),
      listSprints(),
      listAllTaskResults(),
      fetchDepartmentResultKpis(),
      fetchActionPlans(),
      fetchActionMetrics(),
    ]);

  // KPI targets for tất cả tháng có sprint — phục vụ rule chia KPI tháng → sprint
  const sprintMonths = Array.from(new Set(sprints.map((s) => getSprintMonth(s))));
  const kpiTargetsArrays = await Promise.all(sprintMonths.map((m) => listKpiTargets(m)));
  const kpiTargets = kpiTargetsArrays.flat();

  // ── Computed stats ──────────────────────────────────────────────────────────
  const today = new Date();
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const overdue = tasks.filter(isTaskOverdue);
  const urgent = tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length;
  const withKpi = tasks.filter((t) => t.linked_kpi_id).length;
  const kpiLinkPct = tasks.length ? Math.round((withKpi / tasks.length) * 100) : 0;
  const onTime = tasks.length ? Math.round(((tasks.length - overdue.length) / tasks.length) * 100) : 0;

  const statusSegments = [
    { name: "To do",     value: tasks.filter((t) => t.status === "todo").length,        color: "#a1a1aa" },
    { name: "Đang làm",  value: tasks.filter((t) => t.status === "in_progress").length,  color: "#6366f1" },
    { name: "Review",    value: tasks.filter((t) => t.status === "review").length,       color: "#8b5cf6" },
    { name: "Blocked",   value: tasks.filter((t) => t.status === "blocked").length,      color: "#ef4444" },
    { name: "Done",      value: done,                                                    color: "#10b981" },
  ];
  const totalForDonut = statusSegments.reduce((s, x) => s + x.value, 0) || 1;

  // Task type breakdown
  const typeBreakdown = {
    growth:      tasks.filter((t) => t.task_type === "growth").length,
    maintenance: tasks.filter((t) => t.task_type === "maintenance").length,
    admin:       tasks.filter((t) => t.task_type === "admin").length,
    urgent:      tasks.filter((t) => t.task_type === "urgent").length,
  };
  const growthPct = tasks.length ? Math.round((typeBreakdown.growth / tasks.length) * 100) : 0;

  // Workload by assignee
  const byAssignee: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.assignee_id) byAssignee[t.assignee_id] = (byAssignee[t.assignee_id] || 0) + 1;
  });
  const workloadRows = Object.entries(byAssignee)
    .map(([id, count]) => ({
      id,
      name: employees.find((e) => e.id === id)?.full_name ?? "—",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Calendar highlights
  const highlightDays = Array.from(
    new Set(
      tasks
        .map((t) => (t.due_date ? Number(t.due_date.slice(8, 10)) : null))
        .filter((d): d is number => !!d),
    ),
  );

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentDay  = today.getDate();

  return (
    <div>
      <PageHeader
        helpKey="/operations"
        title={t("ops.title")}
        description={t("ops.subtitle")}
      />

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Tổng task"    value={String(tasks.length)} accent="indigo"  icon={<ListChecks className="h-3.5 w-3.5" />} spark={[8, 10, 9, 11, 12, tasks.length]} />
        <KpiCard label="Hoàn thành"   value={String(done)}         accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} spark={[2, 3, 4, 5, 6, done]} delta={22} />
        <KpiCard label="Đang làm"     value={String(inProgress)}   accent="violet"  icon={<Zap className="h-3.5 w-3.5" />} spark={[3, 4, 5, 6, 7, inProgress]} />
        <KpiCard label="Overdue"      value={String(overdue.length)} accent="red"   icon={<AlertTriangle className="h-3.5 w-3.5" />} />
        <KpiCard label="Urgent / High" value={String(urgent)}       accent="amber"  icon={<Zap className="h-3.5 w-3.5" />} />
        <KpiCard label="On-time rate" value={`${onTime}%`}          accent="cyan"   icon={<Target className="h-3.5 w-3.5" />} spark={[85, 87, 88, 90, 91, onTime]} />
      </div>

      {/* ── Collapsible Create Task Form ──────────────────────────────────── */}
      <details className="mb-6 group" id="create-task-details">
        <summary className="flex items-center gap-2 cursor-pointer select-none list-none">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--line-soft)] bg-white shadow-sm hover:bg-zinc-50 transition-colors w-full">
            <Plus className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-zinc-700">Tạo task mới</span>
            <ChevronDown className="h-4 w-4 text-zinc-400 ml-auto group-open:rotate-180 transition-transform" />
          </div>
        </summary>

        <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Thông tin task</CardTitle></CardHeader>
            <CardContent>
              <form action={createTaskFormAction} className="grid gap-3 md:grid-cols-3">
                <Input name="title" placeholder="Tên task" required />
                <select name="assigneeId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                  <option value="">Người phụ trách</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
                <select name="linkedKpiId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                  <option value="">Linked KPI</option>
                  {kpis.map((kpi) => (
                    <option key={kpi.id} value={kpi.id}>{kpi.code ?? kpi.name}</option>
                  ))}
                </select>
                <select name="linkedActionPlanId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                  <option value="">Action Plan</option>
                  {actionPlans.map((plan) => {
                    const kpi = kpis.find((item) => item.id === plan.linked_kpi_id) ?? resultKpis.find((item) => item.id === plan.linked_kpi_id);
                    const kpiLabel = kpi && "code" in kpi ? (kpi.code ?? kpi.name) : (kpi?.name ?? "KPI");
                    return (
                      <option key={plan.id} value={plan.id}>
                        {kpiLabel} - {plan.title}
                      </option>
                    );
                  })}
                </select>
                <select name="actionMetricId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                  <option value="">Chỉ số đo lường</option>
                  {actionMetrics.map((metric) => {
                    const plan = actionPlans.find((item) => item.id === metric.action_plan_id);
                    return (
                      <option key={metric.id} value={metric.id}>
                        {(plan?.title ?? "Plan")} - {metric.name}
                      </option>
                    );
                  })}
                </select>
                <Input name="dueDate" type="date" />
                <select name="priority" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                  <option value="normal">Mức ưu tiên</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select name="taskType" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                  <option value="growth">Chiều hướng tốt</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="admin">Admin</option>
                  <option value="urgent">Urgent task</option>
                </select>
                <TaskExecutionInputs />
                <Button type="submit" className="md:col-span-3">Tạo task</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Phân bổ theo trạng thái</CardTitle></CardHeader>
            <CardContent>
              <KpiHeroDonut
                value={tasks.length}
                label="Tổng task"
                height={160}
                segments={statusSegments.map((s) => ({ ...s, value: (s.value / totalForDonut) * 100 }))}
              />
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                {statusSegments.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </details>

      {/* ── Task Board (Interactive) ──────────────────────────────────────── */}
      <div className="mb-6">
        <OperationsBoard
          tasks={tasks}
          sprints={sprints}
          employees={employees}
          kpis={kpis}
          kpiTargets={kpiTargets}
          resultKpis={resultKpis}
          actionPlans={actionPlans}
          actionMetrics={actionMetrics}
          departments={departments}
          taskResults={taskResults}
          kpiLinkPct={kpiLinkPct}
        />
      </div>

      {/* ── Bottom Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Workload */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Workload theo người</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressList
              rows={workloadRows.map((r) => ({
                label: r.name,
                value: r.count,
                max: Math.max(5, ...workloadRows.map((x) => x.count)),
                right: `${r.count} task`,
                color: r.count > 5 ? "#ef4444" : r.count > 3 ? "#f59e0b" : "#6366f1",
              }))}
            />
            <div className="text-xs text-zinc-500 mt-3">
              <strong>{workloadRows.filter((r) => r.count > 5).length}</strong> người đang quá tải (&gt;5 task).
            </div>
          </CardContent>
        </Card>

        {/* Low-value work */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-600" />
              Low-value work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-zinc-500">Task không gắn KPI</div>
              <div className="text-2xl font-bold text-zinc-900">
                {tasks.filter((t) => !t.linked_kpi_id).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Admin / Maintenance</div>
              <div className="text-2xl font-bold text-zinc-900">
                {typeBreakdown.admin + typeBreakdown.maintenance}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Growth tasks</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-emerald-600">{growthPct}%</div>
                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${growthPct >= 60 ? "bg-emerald-500" : growthPct >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${growthPct}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-xs text-zinc-400">
              Giữ growth &gt;60% để tránh bận rộn mà không tạo value.
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-100">
                  <span className="capitalize text-zinc-600">{type}</span>
                  <span className="font-semibold text-zinc-800">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lịch deadline tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <DeadlineCalendar year={currentYear} month={currentMonth} today={currentDay} tasks={tasks} employees={employees} />
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hoạt động task gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              items={[
                { id: "1", actor: "Nguyễn Hải H", action: "chuyển task sang Review",         time: "5 phút trước",    avatarColor: "bg-indigo-600" },
                { id: "2", actor: "Lý Hoa K",      action: "hoàn thành 'Đăng 15 bài content'", time: "30 phút trước",   avatarColor: "bg-emerald-600" },
                { id: "3", actor: "Phạm Tú L",     action: "block task 'Tối ưu ads Q2'",       time: "2 giờ trước",     avatarColor: "bg-red-500" },
                { id: "4", actor: "Đỗ Quỳnh F",    action: "bắt đầu review SLA vận hành",      time: "hôm qua",         avatarColor: "bg-violet-600" },
                { id: "5", actor: "Trần Minh A",   action: "tạo task sprint mới",              time: "hôm qua",         avatarColor: "bg-cyan-600" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
