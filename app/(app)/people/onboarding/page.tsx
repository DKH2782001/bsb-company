import { ClipboardList, FolderCheck, TimerReset, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/kpi/KpiCard";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";
import { fetchEmployees } from "@/lib/queries";
import {
  listOnboardingRuns,
  listOnboardingRunTasks,
  listOnboardingTemplates,
  listOnboardingTemplateTasks,
} from "@/lib/repositories/onboarding";
import { getAuthenticatedUser, getUserContext } from "@/lib/repositories/shared";

export default async function OnboardingPage() {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);

  const [templates, templateTasks, runs, runTasks, employees] = await Promise.all([
    listOnboardingTemplates(),
    listOnboardingTemplateTasks(),
    listOnboardingRuns(),
    listOnboardingRunTasks(),
    fetchEmployees(),
  ]);

  const templatesWithCounts = templates.map((template) => ({
    ...template,
    task_count: templateTasks.filter((task) => task.template_id === template.id).length,
  }));

  const runsWithNames = runs.map((run) => ({
    ...run,
    employee_name: employees.find((employee) => employee.id === run.employee_id)?.full_name ?? "—",
    template_name: templates.find((template) => template.id === run.template_id)?.name ?? "Manual template",
  }));

  const tasksWithOwner = runTasks.map((task) => ({
    ...task,
    owner_name: employees.find((employee) => employee.id === task.owner_employee_id)?.full_name ?? "—",
  }));

  const activeRuns = runsWithNames.filter((run) => run.status === "in_progress").length;
  const completedRuns = runsWithNames.filter((run) => run.status === "completed").length;
  const overdueTasks = tasksWithOwner.filter((task) => task.status === "overdue").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding / Offboarding"
        description="Checklist workflow · template task · owner tracking · dashboard tiến độ"
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Checklist đang chạy"
          value={String(activeRuns)}
          accent="indigo"
          icon={<ClipboardList className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Run đã xong"
          value={String(completedRuns)}
          accent="emerald"
          icon={<FolderCheck className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Task overdue"
          value={String(overdueTasks)}
          accent="amber"
          icon={<TimerReset className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label="Template khả dụng"
          value={String(templatesWithCounts.length)}
          accent="rose"
          icon={<Users className="h-3.5 w-3.5" />}
        />
      </div>

      <OnboardingManager
        templates={templatesWithCounts}
        runs={runsWithNames}
        tasks={tasksWithOwner}
        employees={employees}
        viewerEmployeeId={context.employeeId}
      />
    </div>
  );
}
