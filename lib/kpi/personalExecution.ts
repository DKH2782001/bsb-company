import type { ActionPlan, Employee, Kpi, Task } from "@/types/domain";

export type PersonalKpiRisk = "low" | "medium" | "high";

export type PersonalKpiTaskInput = Task & {
  assignee_name?: string | null;
  linked_kpi_name?: string | null;
  linked_action_plan_title?: string | null;
  progress?: number | null;
  task_weight?: number | null;
};

export type PersonalKpiTaskDetail = {
  taskId: string;
  taskName: string;
  kpiId: string | null;
  kpiName: string;
  actionPlanId: string | null;
  actionPlanName: string;
  actionTargetValue: number;
  actionActualValue: number;
  weight: number;
  completionPercent: number;
  weightedScore: number;
  status: string;
  dueDate: string | null;
  leadName: string;
};

export type PersonalKpiExecutionRow = {
  employeeId: string;
  employeeName: string;
  role: string;
  kpiCount: number;
  actionPlanCount: number;
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  totalWeight: number;
  weightedScore: number;
  personalKpiPercent: number;
  qualityAvg: number | null;
  risk: PersonalKpiRisk;
  taskDetails: PersonalKpiTaskDetail[];
};

export type CalculatePersonalKpiExecutionOptions = {
  month?: string;
  employees?: Employee[];
  kpis?: Kpi[];
  actionPlans?: ActionPlan[];
  today?: string;
};

const UNLINKED = "Không liên kết";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function isDoneStatus(status: string) {
  return status === "done" || status === "completed";
}

function getTaskDate(task: PersonalKpiTaskInput) {
  return task.due_date ?? task.start_date ?? task.created_at ?? null;
}

function matchesMonth(task: PersonalKpiTaskInput, month?: string) {
  if (!month) return true;
  const date = getTaskDate(task);
  return !date || date.startsWith(month);
}

export function getTaskWeight(task: PersonalKpiTaskInput) {
  const explicitWeight = task.task_weight;
  if (explicitWeight == null || !Number.isFinite(explicitWeight)) return 1;
  return Math.max(0, explicitWeight);
}

export function getTaskCompletionPercent(task: PersonalKpiTaskInput) {
  const target = task.action_target_value ?? 0;
  const actual = task.action_actual_value ?? 0;
  if (!Number.isFinite(target) || target <= 0) return 0;
  if (!Number.isFinite(actual)) return 0;
  return Math.max(0, (actual / target) * 100);
}

function getRisk(row: Pick<PersonalKpiExecutionRow, "overdueTasks" | "blockedTasks">): PersonalKpiRisk {
  if (row.blockedTasks >= 2 || row.overdueTasks >= 2 || (row.blockedTasks > 0 && row.overdueTasks > 0)) {
    return "high";
  }
  if (row.blockedTasks > 0 || row.overdueTasks > 0) return "medium";
  return "low";
}

function isOverdue(task: PersonalKpiTaskInput, today: string) {
  return Boolean(
    task.due_date &&
      task.due_date < today &&
      !isDoneStatus(task.status) &&
      task.status !== "cancelled",
  );
}

export function calculatePersonalKpiExecution(
  tasks: PersonalKpiTaskInput[],
  options: CalculatePersonalKpiExecutionOptions = {},
): PersonalKpiExecutionRow[] {
  const employeeById = new Map((options.employees ?? []).map((employee) => [employee.id, employee]));
  const kpiById = new Map((options.kpis ?? []).map((kpi) => [kpi.id, kpi]));
  const actionPlanById = new Map((options.actionPlans ?? []).map((plan) => [plan.id, plan]));
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const groups = new Map<string, PersonalKpiTaskInput[]>();

  for (const task of tasks) {
    if (!task.assignee_id || !matchesMonth(task, options.month)) continue;
    const current = groups.get(task.assignee_id) ?? [];
    current.push(task);
    groups.set(task.assignee_id, current);
  }

  return Array.from(groups.entries())
    .map(([employeeId, employeeTasks]) => {
      const employee = employeeById.get(employeeId);
      const kpiIds = new Set(employeeTasks.map((task) => task.linked_kpi_id).filter((id): id is string => Boolean(id)));
      const actionPlanIds = new Set(
        employeeTasks.map((task) => task.linked_action_plan_id).filter((id): id is string => Boolean(id)),
      );

      const taskDetails = employeeTasks.map((task) => {
        const weight = getTaskWeight(task);
        const completionPercent = getTaskCompletionPercent(task);
        const weightedScore = weight * completionPercent / 100;
        const kpiId = task.linked_kpi_id ?? null;
        const actionPlanId = task.linked_action_plan_id ?? null;
        return {
          taskId: task.id,
          taskName: task.title,
          kpiId,
          kpiName: task.linked_kpi_name ?? (kpiId ? kpiById.get(kpiId)?.name : null) ?? UNLINKED,
          actionPlanId,
          actionPlanName:
            task.linked_action_plan_title ?? (actionPlanId ? actionPlanById.get(actionPlanId)?.title : null) ?? UNLINKED,
          actionTargetValue: task.action_target_value ?? 0,
          actionActualValue: task.action_actual_value ?? 0,
          weight,
          completionPercent: round2(completionPercent),
          weightedScore: round2(weightedScore),
          status: task.status,
          dueDate: task.due_date ?? null,
          leadName: employee?.manager_id ? employeeById.get(employee.manager_id)?.full_name ?? "Không rõ" : "Không rõ",
        };
      });

      const totalWeight = taskDetails.reduce((sum, task) => sum + task.weight, 0);
      const weightedScore = taskDetails.reduce((sum, task) => sum + task.weightedScore, 0);
      const qualityValues = employeeTasks
        .map((task) => task.quality_score)
        .filter((value): value is number => value != null && Number.isFinite(value));
      const baseRow = {
        employeeId,
        employeeName: employee?.full_name ?? employeeTasks[0]?.assignee_name ?? "Không rõ nhân sự",
        role: employee?.position_id ?? "Không rõ",
        kpiCount: kpiIds.size,
        actionPlanCount: actionPlanIds.size,
        totalTasks: employeeTasks.length,
        doneTasks: employeeTasks.filter((task) => isDoneStatus(task.status)).length,
        overdueTasks: employeeTasks.filter((task) => isOverdue(task, today)).length,
        blockedTasks: employeeTasks.filter((task) => task.status === "blocked").length,
        totalWeight: round2(totalWeight),
        weightedScore: round2(weightedScore),
        personalKpiPercent: totalWeight > 0 ? round2((weightedScore / totalWeight) * 100) : 0,
        qualityAvg: qualityValues.length
          ? round2(qualityValues.reduce((sum, value) => sum + value, 0) / qualityValues.length)
          : null,
        taskDetails,
      };

      return {
        ...baseRow,
        risk: getRisk(baseRow),
      };
    })
    .sort((left, right) => right.personalKpiPercent - left.personalKpiPercent || left.employeeName.localeCompare(right.employeeName));
}
