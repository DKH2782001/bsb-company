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
import { fetchTasks, fetchEmployees, fetchKpis } from "@/lib/queries";
import { createTaskAction, recordTaskOutputAction } from "@/app/(app)/workspace/actions";
import type { Task } from "@/types/domain";
import { CheckCircle2, AlertTriangle, Target, ListChecks, Zap, Wrench } from "lucide-react";

const COLUMNS: Array<{ key: Task["status"]; label: string; tone: string }> = [
  { key: "todo", label: "To do", tone: "bg-zinc-100 text-zinc-700" },
  { key: "in_progress", label: "Đang làm", tone: "bg-indigo-100 text-indigo-700" },
  { key: "review", label: "Review", tone: "bg-violet-100 text-violet-700" },
  { key: "blocked", label: "Blocked", tone: "bg-red-100 text-red-700" },
  { key: "done", label: "Hoàn thành", tone: "bg-emerald-100 text-emerald-700" },
];

export default async function OperationsPage() {
  const { t } = await tServer();
  const [tasks, employees, kpis] = await Promise.all([fetchTasks(), fetchEmployees(), fetchKpis()]);

  const done = tasks.filter((t) => t.status === "done").length;
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const overdue = open.filter((t) => t.due_date && new Date(t.due_date) < new Date("2026-04-23"));
  const urgent = tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length;
  const withKpi = tasks.filter((t) => t.linked_kpi_id).length;
  const kpiLinkPct = tasks.length ? Math.round((withKpi / tasks.length) * 100) : 0;
  const onTime = tasks.length ? Math.round(((tasks.length - overdue.length) / tasks.length) * 100) : 0;

  const statusSegments = [
    { name: "To do", value: tasks.filter((t) => t.status === "todo").length, color: "#a1a1aa" },
    { name: "Đang làm", value: tasks.filter((t) => t.status === "in_progress").length, color: "#6366f1" },
    { name: "Review", value: tasks.filter((t) => t.status === "review").length, color: "#8b5cf6" },
    { name: "Blocked", value: tasks.filter((t) => t.status === "blocked").length, color: "#ef4444" },
    { name: "Done", value: done, color: "#10b981" },
  ];
  const totalForDonut = statusSegments.reduce((s, x) => s + x.value, 0) || 1;

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

  // Calendar highlights: days having task due
  const highlightDays = Array.from(
    new Set(
      tasks
        .map((t) => (t.due_date ? Number(t.due_date.slice(8, 10)) : null))
        .filter((d): d is number => !!d),
    ),
  );

  return (
    <div>
      <PageHeader
        helpKey="/operations"
        title={t("ops.title")}
        description={t("ops.subtitle")}
        actions={<Button>{t("ops.newTask")}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Tổng task" value={String(tasks.length)} accent="indigo" icon={<ListChecks className="h-3.5 w-3.5" />} spark={[8, 10, 9, 11, 12, tasks.length]} />
        <KpiCard label="Hoàn thành" value={String(done)} accent="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} spark={[2, 3, 4, 5, 6, done]} delta={22} />
        <KpiCard label="Đang làm" value={String(open.length)} accent="violet" icon={<Zap className="h-3.5 w-3.5" />} spark={[3, 4, 5, 6, 7, open.length]} />
        <KpiCard label="Overdue" value={String(overdue.length)} accent="red" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
        <KpiCard label="Urgent / High" value={String(urgent)} accent="amber" icon={<Zap className="h-3.5 w-3.5" />} />
        <KpiCard label="On-time rate" value={`${onTime}%`} accent="cyan" icon={<Target className="h-3.5 w-3.5" />} spark={[85, 87, 88, 90, 91, onTime]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Tạo task mới</CardTitle></CardHeader>
          <CardContent>
            <form action={createTaskAction} className="grid gap-3 md:grid-cols-3">
              <Input name="title" placeholder="Tên task" required />
              <select name="assigneeId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="">Assignee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                ))}
              </select>
              <select name="linkedKpiId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="">Linked KPI</option>
                {kpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>{kpi.code ?? kpi.name}</option>
                ))}
              </select>
              <Input name="dueDate" type="date" />
              <select name="priority" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="normal">Priority</option>
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <Button type="submit">Tạo task</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Ghi output task</CardTitle></CardHeader>
          <CardContent>
            <form action={recordTaskOutputAction} className="grid gap-3 md:grid-cols-4">
              <select name="taskId" className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]">
                <option value="">Chọn task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              <Input name="outputType" placeholder="output_type" defaultValue="deliverable" />
              <Input name="value" type="number" placeholder="Giá trị output" required />
              <Button type="submit">Ghi output</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Task board</CardTitle>
            <Badge variant="info">{kpiLinkPct}% task gắn KPI</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.key);
                return (
                  <div
                    key={col.key}
                    className="rounded-xl bg-zinc-50 border border-zinc-200 p-2.5 min-h-[420px]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${col.tone}`}>
                        {col.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">{colTasks.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {colTasks.map((t) => {
                        const assignee = employees.find((e) => e.id === t.assignee_id);
                        const kpi = kpis.find((k) => k.id === t.linked_kpi_id);
                        return (
                          <div
                            key={t.id}
                            className="rounded-lg bg-white border border-zinc-200 p-2 text-xs shadow-sm"
                          >
                            <div className="font-medium text-zinc-900 leading-tight">{t.title}</div>
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {t.priority !== "normal" && (
                                <Badge
                                  variant={
                                    t.priority === "urgent"
                                      ? "danger"
                                      : t.priority === "high"
                                        ? "warning"
                                        : "outline"
                                  }
                                >
                                  {t.priority}
                                </Badge>
                              )}
                              {kpi && <Badge variant="info">{kpi.code}</Badge>}
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-500">
                              <div className="flex items-center gap-1">
                                {assignee && (
                                  <>
                                    <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-semibold">
                                      {assignee.full_name.slice(0, 1)}
                                    </span>
                                    <span className="truncate max-w-[80px]">
                                      {assignee.full_name}
                                    </span>
                                  </>
                                )}
                              </div>
                              <span>{t.due_date?.slice(5) ?? "—"}</span>
                            </div>
                          </div>
                        );
                      })}
                      {colTasks.length === 0 && (
                        <div className="text-xs text-zinc-400 text-center py-3">—</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Phân bổ theo trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <KpiHeroDonut
                value={tasks.length}
                label="Tổng task"
                height={200}
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lịch deadline tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniCalendar year={2026} month={4} today={23} highlights={highlightDays} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-5">
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

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hoạt động task gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              items={[
                { id: "1", actor: "Nguyễn Hải H", action: "chuyển task sang Review", time: "5 phút trước", avatarColor: "bg-indigo-600" },
                { id: "2", actor: "Lý Hoa K", action: "hoàn thành 'Đăng 15 bài content'", time: "30 phút trước", avatarColor: "bg-emerald-600" },
                { id: "3", actor: "Phạm Tú L", action: "block task 'Tối ưu ads Q2'", time: "2 giờ trước", avatarColor: "bg-red-500" },
                { id: "4", actor: "Đỗ Quỳnh F", action: "bắt đầu review SLA vận hành", time: "hôm qua", avatarColor: "bg-violet-600" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-600" />
              Low-value work
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <div className="text-xs text-zinc-500">Task không gắn KPI</div>
              <div className="text-2xl font-bold text-zinc-900">
                {tasks.filter((t) => !t.linked_kpi_id).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Admin / Maintenance</div>
              <div className="text-2xl font-bold text-zinc-900">
                {tasks.filter((t) => t.task_type === "admin" || t.task_type === "maintenance").length}
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              Giữ growth &gt; 60% để tránh bận rộn mà không tạo value.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
