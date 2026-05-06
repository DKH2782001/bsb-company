import { describe, expect, it } from "vitest";

import { calculatePersonalKpiExecution } from "@/lib/kpi/personalExecution";
import type { ActionPlan, Employee, Kpi, Task } from "@/types/domain";

const employees: Employee[] = [
  {
    id: "emp_hieu",
    company_id: "c1",
    auth_user_id: null,
    code: "HIEU",
    full_name: "Hiếu",
    email: "hieu@example.com",
    phone: null,
    avatar_url: null,
    department_id: "dept_sales",
    team_id: null,
    position_id: "Sales/Marketing",
    manager_id: "lead_1",
    join_date: "2026-01-01",
    status: "active",
    base_salary: 0,
    employment_type: "fulltime",
  },
  {
    id: "lead_1",
    company_id: "c1",
    auth_user_id: null,
    code: "LEAD",
    full_name: "Lead Sales",
    email: "lead@example.com",
    phone: null,
    avatar_url: null,
    department_id: "dept_sales",
    team_id: null,
    position_id: "Lead",
    manager_id: null,
    join_date: "2026-01-01",
    status: "active",
    base_salary: 0,
    employment_type: "fulltime",
  },
];

const kpis: Kpi[] = [
  baseKpi("kpi_revenue", "KPI doanh thu"),
  baseKpi("kpi_viral", "KPI tăng viral thương hiệu"),
];

const actionPlans: ActionPlan[] = [
  baseActionPlan("ap_close", "kpi_revenue", "Chốt khách mới"),
  baseActionPlan("ap_viral", "kpi_viral", "Tăng nhận diện thương hiệu"),
];

function baseKpi(id: string, name: string): Kpi {
  return {
    id,
    company_id: "c1",
    code: id,
    name,
    description: null,
    level: "department",
    owner_employee_id: null,
    owner_department_id: "dept_sales",
    owner_team_id: null,
    unit: "%",
    weight: 1,
    parent_kpi_id: null,
    data_source: null,
    active: true,
    target_frequency: "monthly",
  };
}

function baseActionPlan(id: string, linkedKpiId: string, title: string): ActionPlan {
  return {
    id,
    linked_kpi_id: linkedKpiId,
    title,
    description: "",
    owner_id: "lead_1",
    department_id: "dept_sales",
    period: "2026-04",
    status: "active",
    expected_impact_text: "",
    progress_percent: 0,
    total_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    blocked_tasks: 0,
  };
}

function task(input: Partial<Task> & Pick<Task, "id" | "title" | "status">): Task {
  return {
    company_id: "c1",
    description: null,
    assignee_id: "emp_hieu",
    reviewer_id: null,
    department_id: "dept_sales",
    project_id: null,
    linked_kpi_id: null,
    linked_action_plan_id: null,
    action_metric_id: null,
    priority: "normal",
    task_type: "growth",
    due_date: "2026-04-20",
    estimated_hours: null,
    actual_hours: null,
    sprint_id: null,
    story_points: null,
    parent_task_id: null,
    ...input,
  };
}

describe("calculatePersonalKpiExecution", () => {
  it("tính KPI cá nhân 86% từ 2 task trọng số 7 và 3", () => {
    const rows = calculatePersonalKpiExecution(
      [
        task({
          id: "t1",
          title: "Chốt khách mới",
          status: "in_progress",
          linked_kpi_id: "kpi_revenue",
          linked_action_plan_id: "ap_close",
          task_weight: 7,
          action_target_value: 100,
          action_actual_value: 80,
        }),
        task({
          id: "t2",
          title: "Tăng viral thương hiệu",
          status: "done",
          linked_kpi_id: "kpi_viral",
          linked_action_plan_id: "ap_viral",
          task_weight: 3,
          action_target_value: 10,
          action_actual_value: 10,
        }),
      ],
      { employees, kpis, actionPlans, month: "2026-04", today: "2026-04-30" },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].employeeName).toBe("Hiếu");
    expect(rows[0].kpiCount).toBe(2);
    expect(rows[0].actionPlanCount).toBe(2);
    expect(rows[0].totalTasks).toBe(2);
    expect(rows[0].doneTasks).toBe(1);
    expect(rows[0].totalWeight).toBe(10);
    expect(rows[0].weightedScore).toBe(8.6);
    expect(rows[0].personalKpiPercent).toBe(86);
  });

  it("trả KPI cá nhân 0 khi totalWeight = 0", () => {
    const rows = calculatePersonalKpiExecution(
      [task({ id: "t1", title: "Zero weight", status: "done", task_weight: 0, action_target_value: 10, action_actual_value: 10 })],
      { employees, month: "2026-04" },
    );

    expect(rows[0].totalWeight).toBe(0);
    expect(rows[0].personalKpiPercent).toBe(0);
  });

  it("đếm unique KPI và Action Plan dù nhiều task cùng nhân viên", () => {
    const rows = calculatePersonalKpiExecution(
      [
        task({ id: "t1", title: "Task A", status: "done", linked_kpi_id: "kpi_revenue", linked_action_plan_id: "ap_close" }),
        task({ id: "t2", title: "Task B", status: "done", linked_kpi_id: "kpi_revenue", linked_action_plan_id: "ap_close" }),
        task({ id: "t3", title: "Task C", status: "done", linked_kpi_id: "kpi_viral", linked_action_plan_id: "ap_viral" }),
      ],
      { employees, month: "2026-04" },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].kpiCount).toBe(2);
    expect(rows[0].actionPlanCount).toBe(2);
  });

  it("đếm done, overdue và blocked", () => {
    const rows = calculatePersonalKpiExecution(
      [
        task({ id: "t1", title: "Done", status: "done", due_date: "2026-04-01" }),
        task({ id: "t2", title: "Overdue", status: "in_progress", due_date: "2026-04-01" }),
        task({ id: "t3", title: "Blocked", status: "blocked", due_date: "2026-04-28" }),
      ],
      { employees, month: "2026-04", today: "2026-04-30" },
    );

    expect(rows[0].doneTasks).toBe(1);
    expect(rows[0].overdueTasks).toBe(2);
    expect(rows[0].blockedTasks).toBe(1);
    expect(rows[0].risk).toBe("high");
  });

  it("fallback completion theo status và default weight = 1", () => {
    const rows = calculatePersonalKpiExecution(
      [
        task({ id: "t1", title: "Done", status: "done", action_target_value: 10, action_actual_value: 10 }),
        task({ id: "t2", title: "Doing", status: "in_progress", action_target_value: 10, action_actual_value: 5 }),
        task({ id: "t3", title: "Todo", status: "todo", action_target_value: 10, action_actual_value: 0 }),
      ],
      { employees, month: "2026-04" },
    );

    expect(rows[0].totalWeight).toBe(3);
    expect(rows[0].weightedScore).toBe(1.5);
    expect(rows[0].personalKpiPercent).toBe(50);
  });

  it("không tự cho done = 100 nếu thiếu actual, và cho phép vượt 100%", () => {
    const rows = calculatePersonalKpiExecution(
      [
        task({ id: "t1", title: "Done without actual", status: "done", action_target_value: 10 }),
        task({ id: "t2", title: "Over target", status: "done", action_target_value: 25, action_actual_value: 30 }),
      ],
      { employees, month: "2026-04" },
    );

    expect(rows[0].taskDetails[0].completionPercent).toBe(0);
    expect(rows[0].taskDetails[1].completionPercent).toBe(120);
    expect(rows[0].personalKpiPercent).toBe(60);
  });

  it("trả empty array nếu không có data", () => {
    expect(calculatePersonalKpiExecution([], { month: "2026-04" })).toEqual([]);
  });
});
