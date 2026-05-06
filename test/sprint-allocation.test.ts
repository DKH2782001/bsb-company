import { describe, expect, it } from "vitest";

import { buildKpiAllocation, getSprintMonth, validateTaskAllocation } from "@/lib/kpi/sprintAllocation";
import type { Kpi, Sprint, Task } from "@/types/domain";

function kpi(input: Partial<Kpi> = {}): Kpi {
  return {
    id: "kpi_monthly",
    company_id: "c1",
    code: "REV",
    name: "Doanh thu Q2",
    description: null,
    level: "department",
    owner_employee_id: null,
    owner_department_id: null,
    owner_team_id: null,
    unit: "deal",
    weight: 1,
    parent_kpi_id: null,
    data_source: null,
    active: true,
    target_frequency: "monthly",
    ...input,
  };
}

function sprint(id: string, start: string, end: string): Sprint {
  return {
    id,
    company_id: "c1",
    name: id,
    goal: null,
    start_date: start,
    end_date: end,
    status: "planning",
    capacity: 0,
    velocity: null,
    completed_points: null,
    carry_over_points: null,
    completion_rate: null,
    created_at: `${start}T00:00:00.000Z`,
    completed_at: null,
    retrospective: null,
  };
}

function task(input: Partial<Task>): Task {
  return {
    id: "task",
    company_id: "c1",
    title: "Task",
    description: null,
    assignee_id: null,
    reviewer_id: null,
    department_id: null,
    project_id: null,
    linked_kpi_id: "kpi_monthly",
    priority: "normal",
    task_type: "growth",
    status: "todo",
    due_date: null,
    estimated_hours: null,
    actual_hours: null,
    sprint_id: null,
    story_points: null,
    parent_task_id: null,
    ...input,
  };
}

describe("sprint KPI allocation", () => {
  it("split 100 into two sprint allocations = 50/50", () => {
    const sprints = [sprint("s1", "2026-05-01", "2026-05-14"), sprint("s2", "2026-05-15", "2026-05-28")];
    const allocation = buildKpiAllocation({ kpi: kpi(), monthlyTarget: 100, monthSprints: sprints, tasksInScope: [] });

    expect(allocation.sprints.map((row) => row.splitTarget)).toEqual([50, 50]);
    expect(allocation.gap).toBe(100);
  });

  it("sprint A allocated 30 leaves remaining 20", () => {
    const sprints = [sprint("s1", "2026-05-01", "2026-05-14"), sprint("s2", "2026-05-15", "2026-05-28")];
    const allocation = buildKpiAllocation({
      kpi: kpi(),
      monthlyTarget: 100,
      monthSprints: sprints,
      tasksInScope: [task({ id: "t1", sprint_id: "s1", action_target_value: 30 })],
    });

    expect(allocation.sprints[0].allocatedValue).toBe(30);
    expect(allocation.sprints[0].remaining).toBe(20);
  });

  it("proposal 25 for sprint A fails when remaining is 20", () => {
    const sprints = [sprint("s1", "2026-05-01", "2026-05-14"), sprint("s2", "2026-05-15", "2026-05-28")];
    const allocation = buildKpiAllocation({
      kpi: kpi(),
      monthlyTarget: 100,
      monthSprints: sprints,
      tasksInScope: [task({ id: "t1", sprint_id: "s1", action_target_value: 30 })],
    });

    const result = validateTaskAllocation({ allocation, targetSprintId: "s1", proposedValue: 25 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.remaining).toBe(20);
      expect(result.reason).toContain("Vượt 5");
    }
  });

  it("proposal 20 for sprint A is ok and gap remains 50 for sprint B before submit", () => {
    const sprints = [sprint("s1", "2026-05-01", "2026-05-14"), sprint("s2", "2026-05-15", "2026-05-28")];
    const allocation = buildKpiAllocation({
      kpi: kpi(),
      monthlyTarget: 100,
      monthSprints: sprints,
      tasksInScope: [task({ id: "t1", sprint_id: "s1", action_target_value: 30 })],
    });

    expect(validateTaskAllocation({ allocation, targetSprintId: "s1", proposedValue: 20 })).toEqual({ ok: true });
    expect(allocation.gap).toBe(70);
    expect(allocation.gap - 20).toBe(50);
  });

  it("cross-month sprint chooses month with at least 8 days", () => {
    expect(getSprintMonth(sprint("s", "2026-04-28", "2026-05-11"))).toBe("2026-05");
  });

  it("integer unit split uses ceil", () => {
    const sprints = [sprint("s1", "2026-05-01", "2026-05-14"), sprint("s2", "2026-05-15", "2026-05-28")];
    const allocation = buildKpiAllocation({ kpi: kpi({ unit: "lead" }), monthlyTarget: 101, monthSprints: sprints, tasksInScope: [] });
    expect(allocation.sprints[0].splitTarget).toBe(51);
  });

  it("update excludes current task from allocated sprint", () => {
    const sprints = [sprint("s1", "2026-05-01", "2026-05-14"), sprint("s2", "2026-05-15", "2026-05-28")];
    const allocation = buildKpiAllocation({
      kpi: kpi(),
      monthlyTarget: 100,
      monthSprints: sprints,
      tasksInScope: [
        task({ id: "current", sprint_id: "s1", action_target_value: 40 }),
        task({ id: "other", sprint_id: "s1", action_target_value: 10 }),
      ],
      excludeTaskId: "current",
    });

    expect(allocation.sprints[0].allocatedValue).toBe(10);
    expect(allocation.sprints[0].remaining).toBe(40);
  });

  it("more than two sprints divides evenly by sprint count", () => {
    const sprints = [
      sprint("s1", "2026-05-01", "2026-05-07"),
      sprint("s2", "2026-05-08", "2026-05-14"),
      sprint("s3", "2026-05-15", "2026-05-21"),
      sprint("s4", "2026-05-22", "2026-05-28"),
    ];
    const allocation = buildKpiAllocation({ kpi: kpi({ unit: "%" }), monthlyTarget: 100, monthSprints: sprints, tasksInScope: [] });
    expect(allocation.sprints.map((row) => row.splitTarget)).toEqual([25, 25, 25, 25]);
  });
});
