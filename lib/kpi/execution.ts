import type {
  ActionMetric,
  ActionPlan,
  Department,
  DepartmentResultKpi,
  Employee,
  EmployeeExecution,
  EmployeeRiskStatus,
  ExecutionStatus,
  Task,
} from "@/types/domain";
import type { KpiRow } from "@/lib/kpi/cascade";
import { calculatePersonalKpiExecution, type PersonalKpiExecutionRow } from "@/lib/kpi/personalExecution";

export function calculateCompletion(actual: number, target: number) {
  if (!Number.isFinite(actual) || !Number.isFinite(target) || target <= 0) return 0;
  return actual / target;
}

export function calculateRemaining(actual: number, target: number) {
  return Math.max(target - actual, 0);
}

export function calculateRequiredPerDay(remaining: number, daysLeft: number) {
  if (!Number.isFinite(remaining) || remaining <= 0) return 0;
  if (!Number.isFinite(daysLeft) || daysLeft <= 0) return remaining;
  return remaining / daysLeft;
}

export function getStatusByCompletion(completion: number): ExecutionStatus {
  if (completion >= 1) return "green";
  if (completion >= 0.85) return "yellow";
  return "red";
}

export function getEmployeeRiskStatus(employee: Pick<
  EmployeeExecution,
  "action_completion" | "overdue_tasks" | "blocked_tasks"
>): EmployeeRiskStatus {
  if (employee.action_completion < 0.6 || employee.blocked_tasks >= 2 || employee.overdue_tasks >= 2) {
    return "red";
  }
  if (employee.action_completion < 0.85 || employee.overdue_tasks > 0 || employee.blocked_tasks > 0) {
    return "yellow";
  }
  return "green";
}

export function getExecutionAlignmentInsight(
  kpiCompletion: number,
  actionPlanCompletion: number,
  taskCompletion: number,
  avgSla: number,
  avgQuality: number,
) {
  if (taskCompletion >= 0.7 && kpiCompletion < 0.85) {
    return "Nhiều task đã hoàn thành nhưng KPI kết quả chưa tăng tương ứng. Cần kiểm tra chất lượng hành động hoặc data source.";
  }
  if (kpiCompletion < 0.85 && taskCompletion < 0.7) {
    return "KPI có nguy cơ không đạt do thực thi chậm.";
  }
  if (kpiCompletion >= 0.85 && taskCompletion < 0.7) {
    return "KPI đang tốt nhưng kế hoạch hành động chưa được cập nhật đầy đủ hoặc có nguồn tăng trưởng khác.";
  }
  if (avgSla < 85 || avgQuality < 85) {
    return "Chất lượng xử lý có thể ảnh hưởng đến khả năng nhận đánh giá 5 sao.";
  }
  if (actionPlanCompletion < 0.7) {
    return "Các action plan đang chậm hơn nhịp cần thiết để kéo KPI về đích.";
  }
  return "Thực thi đang bám sát KPI kết quả. Duy trì nhịp task và chất lượng xử lý.";
}

export type EnrichedActionMetric = ActionMetric & {
  owner_name: string | null;
  assignee_name: string | null;
};

export type EnrichedActionPlan = ActionPlan & {
  owner_name: string;
  progress_ratio: number;
  metrics: EnrichedActionMetric[];
  tasks: Task[];
};

export type EnrichedEmployeeExecution = EmployeeExecution & {
  department_name: string;
  linked_action_plan_title: string;
};

export type EnrichedLinkedTask = Task & {
  assignee_name: string;
  department_name: string;
  linked_kpi_name: string;
  linked_action_plan_title: string | null;
  action_metric_name: string | null;
  action_completion: number | null;
};

export type KpiExecutionInsight = {
  id: string;
  tone: ExecutionStatus | "info";
  text: string;
};

export type KpiExecutionAlignment = {
  kpi_completion: number;
  action_plan_completion: number;
  task_completion: number;
  avg_sla: number;
  avg_quality: number;
  insight: string;
};

export type KpiExecutionSnapshot = {
  result_kpi: DepartmentResultKpi;
  completion: number;
  remaining: number;
  required_per_day: number;
  action_plans: EnrichedActionPlan[];
  employee_execution: EnrichedEmployeeExecution[];
  personal_kpi_execution: PersonalKpiExecutionRow[];
  linked_tasks: EnrichedLinkedTask[];
  alignment: KpiExecutionAlignment;
  insights: KpiExecutionInsight[];
};

export type KpiExecutionPanel = {
  kpi_id: string;
  summary: {
    id: string;
    name: string;
    code: string | null;
    level: KpiRow["level"];
    department_id: string | null;
    department_name: string;
    period: string;
    type: "result_kpi" | "kpi";
    unit: string;
    target: number;
    actual: number;
    completion: number;
    remaining: number;
    days_left: number;
    required_per_day: number;
    data_source: string;
    rollup_mode: "manual" | "third_party" | "import";
    status: ExecutionStatus;
    last_updated_at: string;
    is_result_kpi: boolean;
    description: string | null;
  };
  action_plans: EnrichedActionPlan[];
  linked_metrics: EnrichedActionMetric[];
  employee_execution: EnrichedEmployeeExecution[];
  personal_kpi_execution: PersonalKpiExecutionRow[];
  linked_tasks: EnrichedLinkedTask[];
  alignment: KpiExecutionAlignment;
  insights: KpiExecutionInsight[];
  node_meta: {
    action_plan_count: number;
    task_count: number;
    overdue_task_count: number;
    blocked_task_count: number;
    execution_risk: ExecutionStatus;
  };
};

function inferRollupMode(row: KpiRow): "manual" | "third_party" | "import" {
  if (row.calcMode === "manual") return "manual";
  if (row.data_source && row.data_source !== "manual_import") return "third_party";
  return "import";
}

function inferExecutionRisk(params: {
  completion: number;
  actionPlanCompletion: number;
  taskCompletion: number;
  blockedTasks: number;
  overdueTasks: number;
}) {
  if (
    params.blockedTasks > 0 ||
    params.overdueTasks >= 3 ||
    params.completion < 0.6 ||
    params.actionPlanCompletion < 0.6 ||
    params.taskCompletion < 0.6
  ) {
    return "red" as const;
  }
  if (
    params.overdueTasks > 0 ||
    params.completion < 0.85 ||
    params.actionPlanCompletion < 0.85 ||
    params.taskCompletion < 0.85
  ) {
    return "yellow" as const;
  }
  return "green" as const;
}

export function buildKpiExecutionSnapshots(input: {
  departmentKpis: DepartmentResultKpi[];
  actionPlans: ActionPlan[];
  actionMetrics: ActionMetric[];
  employeeExecution: EmployeeExecution[];
  tasks: Task[];
  employees: Employee[];
  departments: Department[];
}) {
  const employeeById = new Map(input.employees.map((employee) => [employee.id, employee]));
  const departmentById = new Map(input.departments.map((department) => [department.id, department]));
  const actionMetricById = new Map(input.actionMetrics.map((metric) => [metric.id, metric]));

  return input.departmentKpis.map((resultKpi) => {
    const completion = calculateCompletion(resultKpi.actual, resultKpi.target);
    const remaining = calculateRemaining(resultKpi.actual, resultKpi.target);
    const requiredPerDay = calculateRequiredPerDay(remaining, resultKpi.days_left);
    const tasks = input.tasks.filter((task) => task.linked_kpi_id === resultKpi.id);

    const actionPlans = input.actionPlans
      .filter((plan) => plan.linked_kpi_id === resultKpi.id)
      .map((plan) => ({
        ...plan,
        owner_name: employeeById.get(plan.owner_id)?.full_name ?? "—",
        progress_ratio: plan.progress_percent / 100,
        metrics: input.actionMetrics
          .filter((metric) => metric.action_plan_id === plan.id)
          .map((metric) => ({
            ...metric,
            owner_name: metric.owner_id ? employeeById.get(metric.owner_id)?.full_name ?? null : null,
            assignee_name: metric.assignee_id ? employeeById.get(metric.assignee_id)?.full_name ?? null : null,
          })),
        tasks: tasks.filter((task) => task.linked_action_plan_id === plan.id),
      }));

    const employeeExecution = input.employeeExecution
      .filter((employee) => employee.linked_kpi_id === resultKpi.id)
      .map((employee) => ({
        ...employee,
        risk_status: getEmployeeRiskStatus(employee),
        department_name: departmentById.get(employee.department_id)?.name ?? "—",
        linked_action_plan_title:
          actionPlans.find((plan) => plan.id === employee.linked_action_plan_id)?.title ??
          employee.linked_action_plan_id,
      }));

    const linkedTasks = tasks.map((task) => {
      const metric = task.action_metric_id ? actionMetricById.get(task.action_metric_id) : null;
      return {
        ...task,
        assignee_name: task.assignee_id ? employeeById.get(task.assignee_id)?.full_name ?? "Chưa giao" : "Chưa giao",
        department_name: task.department_id ? departmentById.get(task.department_id)?.name ?? "—" : "—",
        linked_kpi_name: resultKpi.name,
        linked_action_plan_title: task.linked_action_plan_id
          ? actionPlans.find((plan) => plan.id === task.linked_action_plan_id)?.title ?? null
          : null,
        action_metric_name: metric?.name ?? null,
        action_completion:
          task.action_target_value && task.action_target_value > 0 && task.action_actual_value != null
            ? calculateCompletion(task.action_actual_value, task.action_target_value)
            : null,
      };
    });
    const personalKpiExecution = calculatePersonalKpiExecution(linkedTasks, {
      employees: input.employees,
      actionPlans: input.actionPlans,
      month: resultKpi.period,
      today: `${resultKpi.period}-30`,
    });

    const doneTasks = linkedTasks.filter((task) => task.status === "done").length;
    const actionPlanCompletion =
      actionPlans.reduce((sum, plan) => sum + plan.progress_ratio, 0) / Math.max(1, actionPlans.length);
    const taskCompletion = doneTasks / Math.max(1, linkedTasks.length);
    const avgSla =
      employeeExecution.reduce((sum, employee) => sum + employee.sla_score, 0) /
      Math.max(1, employeeExecution.length);
    const avgQuality =
      employeeExecution.reduce((sum, employee) => sum + employee.quality_score, 0) /
      Math.max(1, employeeExecution.length);

    const alignment = {
      kpi_completion: completion,
      action_plan_completion: actionPlanCompletion,
      task_completion: taskCompletion,
      avg_sla: avgSla,
      avg_quality: avgQuality,
      insight: getExecutionAlignmentInsight(completion, actionPlanCompletion, taskCompletion, avgSla, avgQuality),
    };

    const overdueTasks = linkedTasks.filter(
      (task) => task.status !== "done" && task.status !== "cancelled" && task.due_date && task.due_date < "2026-04-30",
    ).length;
    const blockedTasks = linkedTasks.filter((task) => task.status === "blocked").length;
    const weakestEmployee = employeeExecution
      .slice()
      .sort((left, right) => left.action_completion - right.action_completion)[0];
    const strongestEmployee = employeeExecution
      .slice()
      .sort((left, right) => right.action_completion - left.action_completion)[0];
    const highEffortLowResult =
      actionPlanCompletion >= 0.7 && completion < 0.85
        ? "Action metrics đang chạy khá tốt nhưng KPI kết quả chưa tăng tương ứng. Cần kiểm tra chất lượng hành động hoặc nguồn dữ liệu."
        : null;

    const insights: KpiExecutionInsight[] = [
      completion < 0.85 && actionPlanCompletion < 0.7
        ? {
            id: `${resultKpi.id}-kpi-risk`,
            tone: "red",
            text: "KPI đang đỏ trong khi action plan completion còn thấp. Cần ưu tiên unblock task và đẩy cadence follow-up.",
          }
        : null,
      {
        id: `${resultKpi.id}-gap`,
        tone: completion >= 1 ? "green" : "yellow",
        text: `KPI còn thiếu ${remaining.toLocaleString("vi-VN")} ${resultKpi.unit}, cần ${Math.ceil(requiredPerDay).toLocaleString("vi-VN")} ${resultKpi.unit}/ngày để về đích.`,
      },
      overdueTasks > 0
        ? {
            id: `${resultKpi.id}-overdue`,
            tone: "yellow",
            text: `Có ${overdueTasks} task quá hạn liên quan KPI này.`,
          }
        : null,
      blockedTasks > 0
        ? {
            id: `${resultKpi.id}-blocked`,
            tone: "red",
            text: `Có ${blockedTasks} task blocked đang cản execution của KPI.`,
          }
        : null,
      weakestEmployee
        ? {
            id: `${resultKpi.id}-weakest`,
            tone: weakestEmployee.risk_status,
            text: `${weakestEmployee.employee_name} đang có action completion thấp (${Math.round(
              weakestEmployee.action_completion * 100,
            )}%).`,
          }
        : null,
      strongestEmployee
        ? {
            id: `${resultKpi.id}-strongest`,
            tone: "green",
            text: `${strongestEmployee.employee_name} đang thực thi tốt (${Math.round(
              strongestEmployee.action_completion * 100,
            )}%), có thể hỗ trợ nhóm.`,
          }
        : null,
      highEffortLowResult
        ? {
            id: `${resultKpi.id}-quality-check`,
            tone: "info",
            text: highEffortLowResult,
          }
        : null,
    ].filter((insight): insight is KpiExecutionInsight => Boolean(insight));

    return {
      result_kpi: {
        ...resultKpi,
        status: getStatusByCompletion(completion),
      },
      completion,
      remaining,
      required_per_day: requiredPerDay,
      action_plans: actionPlans,
      employee_execution: employeeExecution,
      personal_kpi_execution: personalKpiExecution,
      linked_tasks: linkedTasks,
      alignment,
      insights,
    };
  });
}

export function buildKpiExecutionPanels(input: {
  rows: KpiRow[];
  departmentKpis: DepartmentResultKpi[];
  actionPlans: ActionPlan[];
  actionMetrics: ActionMetric[];
  employeeExecution: EmployeeExecution[];
  tasks: Task[];
  employees: Employee[];
  departments: Department[];
}) {
  const employeeById = new Map(input.employees.map((employee) => [employee.id, employee]));
  const departmentById = new Map(input.departments.map((department) => [department.id, department]));
  const departmentResultById = new Map(input.departmentKpis.map((kpi) => [kpi.id, kpi]));
  const actionMetricById = new Map(input.actionMetrics.map((metric) => [metric.id, metric]));

  return input.rows.map((row) => {
    const resultKpi = departmentResultById.get(row.id);
    const target = resultKpi?.target ?? row.target ?? 0;
    const actual = resultKpi?.actual ?? row.actual ?? 0;
    const completion = resultKpi ? calculateCompletion(actual, target) : row.completion ?? calculateCompletion(actual, target);
    const remaining = calculateRemaining(actual, target);
    const daysLeft = resultKpi?.days_left ?? 0;
    const requiredPerDay = calculateRequiredPerDay(remaining, daysLeft);
    const linkedTasks = input.tasks.filter((task) => task.linked_kpi_id === row.id);

    const actionPlans = input.actionPlans
      .filter((plan) => plan.linked_kpi_id === row.id)
      .map((plan) => ({
        ...plan,
        owner_name: employeeById.get(plan.owner_id)?.full_name ?? "—",
        progress_ratio: plan.progress_percent / 100,
        metrics: input.actionMetrics
          .filter((metric) => metric.action_plan_id === plan.id)
          .map((metric) => ({
            ...metric,
            owner_name: metric.owner_id ? employeeById.get(metric.owner_id)?.full_name ?? null : null,
            assignee_name: metric.assignee_id ? employeeById.get(metric.assignee_id)?.full_name ?? null : null,
          })),
        tasks: linkedTasks.filter((task) => task.linked_action_plan_id === plan.id),
      }));

    const linkedMetrics = actionPlans.flatMap((plan) => plan.metrics);

    const employeeExecution = input.employeeExecution
      .filter((employee) => employee.linked_kpi_id === row.id)
      .map((employee) => ({
        ...employee,
        risk_status: getEmployeeRiskStatus(employee),
        department_name: departmentById.get(employee.department_id)?.name ?? "—",
        linked_action_plan_title:
          actionPlans.find((plan) => plan.id === employee.linked_action_plan_id)?.title ??
          employee.linked_action_plan_id,
      }));

    const enrichedTasks = linkedTasks.map((task) => {
      const metric = task.action_metric_id ? actionMetricById.get(task.action_metric_id) : null;
      return {
        ...task,
        assignee_name: task.assignee_id ? employeeById.get(task.assignee_id)?.full_name ?? "Chưa giao" : "Chưa giao",
        department_name: task.department_id ? departmentById.get(task.department_id)?.name ?? "—" : "—",
        linked_kpi_name: resultKpi?.name ?? row.name,
        linked_action_plan_title: task.linked_action_plan_id
          ? actionPlans.find((plan) => plan.id === task.linked_action_plan_id)?.title ?? null
          : null,
        action_metric_name: metric?.name ?? null,
        action_completion:
          task.action_target_value && task.action_target_value > 0 && task.action_actual_value != null
            ? calculateCompletion(task.action_actual_value, task.action_target_value)
            : null,
      };
    });
    const personalKpiExecution = calculatePersonalKpiExecution(enrichedTasks, {
      employees: input.employees,
      actionPlans: input.actionPlans,
      month: resultKpi?.period ?? "2026-04",
      today: `${resultKpi?.period ?? "2026-04"}-30`,
    });

    const doneTasks = enrichedTasks.filter((task) => task.status === "done").length;
    const overdueTasks = enrichedTasks.filter(
      (task) => task.status !== "done" && task.status !== "cancelled" && task.due_date && task.due_date < "2026-04-30",
    ).length;
    const blockedTasks = enrichedTasks.filter((task) => task.status === "blocked").length;
    const actionPlanCompletion =
      actionPlans.reduce((sum, plan) => sum + plan.progress_ratio, 0) / Math.max(1, actionPlans.length);
    const taskCompletion = doneTasks / Math.max(1, enrichedTasks.length);
    const avgSla =
      employeeExecution.reduce((sum, employee) => sum + employee.sla_score, 0) /
      Math.max(1, employeeExecution.length);
    const avgQuality =
      employeeExecution.reduce((sum, employee) => sum + employee.quality_score, 0) /
      Math.max(1, employeeExecution.length);
    const executionRisk =
      actionPlans.length === 0 && enrichedTasks.length === 0 && employeeExecution.length === 0
        ? getStatusByCompletion(completion)
        : inferExecutionRisk({
            completion,
            actionPlanCompletion,
            taskCompletion,
            blockedTasks,
            overdueTasks,
          });

    const weakestEmployee = employeeExecution
      .slice()
      .sort((left, right) => left.action_completion - right.action_completion)[0];
    const strongestEmployee = employeeExecution
      .slice()
      .sort((left, right) => right.action_completion - left.action_completion)[0];

    const insights: KpiExecutionInsight[] = [
      actionPlans.length > 0 && completion < 0.85 && actionPlanCompletion < 0.7
        ? {
            id: `${row.id}-kpi-risk`,
            tone: "red",
            text: "KPI đang đỏ trong khi action plan completion còn thấp. Cần ưu tiên unblock task và đẩy execution.",
          }
        : null,
      {
        id: `${row.id}-gap`,
        tone: completion >= 1 ? "green" : "yellow",
        text:
          daysLeft > 0
            ? `KPI còn thiếu ${remaining.toLocaleString("vi-VN")} ${row.unit}, cần ${Math.ceil(requiredPerDay).toLocaleString("vi-VN")} ${row.unit}/ngày để về đích.`
            : `KPI đang ở mức ${Math.round(completion * 100)}% so với target hiện tại.`,
      },
      overdueTasks > 0
        ? {
            id: `${row.id}-overdue`,
            tone: "yellow",
            text: `Có ${overdueTasks} task quá hạn liên quan KPI này.`,
          }
        : null,
      blockedTasks > 0
        ? {
            id: `${row.id}-blocked`,
            tone: "red",
            text: `Có ${blockedTasks} task blocked đang cản execution của KPI này.`,
          }
        : null,
      weakestEmployee
        ? {
            id: `${row.id}-weakest`,
            tone: weakestEmployee.risk_status,
            text: `${weakestEmployee.employee_name} đang có action completion thấp (${Math.round(
              weakestEmployee.action_completion * 100,
            )}%).`,
          }
        : null,
      strongestEmployee
        ? {
            id: `${row.id}-strongest`,
            tone: "green",
            text: `${strongestEmployee.employee_name} đang thực thi tốt (${Math.round(
              strongestEmployee.action_completion * 100,
            )}%), có thể hỗ trợ nhóm.`,
          }
        : null,
      actionPlans.length > 0 && actionPlanCompletion >= 0.7 && completion < 0.85
        ? {
            id: `${row.id}-quality-check`,
            tone: "info",
            text: "Action metrics đang chạy khá tốt nhưng KPI kết quả chưa tăng tương ứng. Cần kiểm tra chất lượng hành động hoặc nguồn dữ liệu.",
          }
        : null,
    ].filter((insight): insight is KpiExecutionInsight => Boolean(insight));

    return {
      kpi_id: row.id,
      summary: {
        id: row.id,
        name: resultKpi?.name ?? row.name,
        code: row.code,
        level: row.level,
        department_id: row.owner_department_id,
        department_name: resultKpi?.department_name ?? (row.owner_department_id ? departmentById.get(row.owner_department_id)?.name ?? "—" : "Company"),
        period: resultKpi?.period ?? "2026-04",
        type: resultKpi ? "result_kpi" : "kpi",
        unit: resultKpi?.unit ?? row.unit,
        target,
        actual,
        completion,
        remaining,
        days_left: daysLeft,
        required_per_day: requiredPerDay,
        data_source: resultKpi?.data_source ?? row.data_source ?? "manual",
        rollup_mode: resultKpi?.rollup_mode ?? inferRollupMode(row),
        status: resultKpi?.status ?? getStatusByCompletion(completion),
        last_updated_at: resultKpi?.last_updated_at ?? "2026-04-30T00:00:00Z",
        is_result_kpi: Boolean(resultKpi),
        description: row.description,
      },
      action_plans: actionPlans,
      linked_metrics: linkedMetrics,
      employee_execution: employeeExecution,
      personal_kpi_execution: personalKpiExecution,
      linked_tasks: enrichedTasks,
      alignment: {
        kpi_completion: completion,
        action_plan_completion: actionPlanCompletion,
        task_completion: taskCompletion,
        avg_sla: avgSla,
        avg_quality: avgQuality,
        insight: getExecutionAlignmentInsight(completion, actionPlanCompletion, taskCompletion, avgSla, avgQuality),
      },
      insights,
      node_meta: {
        action_plan_count: actionPlans.length,
        task_count: enrichedTasks.length,
        overdue_task_count: overdueTasks,
        blocked_task_count: blockedTasks,
        execution_risk: executionRisk,
      },
    } satisfies KpiExecutionPanel;
  });
}
