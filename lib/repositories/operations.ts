import * as demo from "@/lib/queries/demo";
import {
  executionDemoActionMetrics,
  executionDemoActionPlans,
  executionDemoKpis,
  executionDemoTasks,
} from "@/lib/queries/kpiExecutionDemo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import type { Task, Sprint, TaskResult } from "@/types/domain";

function shouldUseDemoStore() {
  return isDemoMode() || !hasSupabaseEnv();
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function mergeTasks(primary: Task[], secondary: Task[]) {
  const seen = new Set(primary.map((task) => task.id));
  return [...primary, ...secondary.filter((task) => !seen.has(task.id))];
}

function executionTaskIndex(taskId: string) {
  return executionDemoTasks.findIndex((task) => task.id === taskId);
}

function demoTaskIndex(taskId: string) {
  return demo.demoTasks.findIndex((task) => task.id === taskId);
}

function isLinkedToExecution(input: {
  linkedKpiId?: string | null;
  linkedActionPlanId?: string | null;
  actionMetricId?: string | null;
}) {
  return Boolean(
    (input.linkedKpiId && executionDemoKpis.some((row) => row.id === input.linkedKpiId)) ||
      (input.linkedActionPlanId && executionDemoActionPlans.some((row) => row.id === input.linkedActionPlanId)) ||
      (input.actionMetricId && executionDemoActionMetrics.some((row) => row.id === input.actionMetricId)),
  );
}

export async function listTasks() {
  return withDemoFallback(mergeTasks(demo.demoTasks, executionDemoTasks), async (db) => {
    const { data, error } = await db.from("tasks").select("*").order("due_date");
    if (error) throw error;
    return mergeTasks((data ?? []) as Task[], executionDemoTasks);
  });
}

export async function getTask(taskId: string): Promise<Task | null> {
  const executionTask = executionDemoTasks.find((t) => t.id === taskId);
  if (executionTask) return executionTask;
  if (shouldUseDemoStore()) {
    return demo.demoTasks.find((t) => t.id === taskId) ?? null;
  }
  try {
    const db = await getDbClientOrThrow();
    const { data } = await (db.from("tasks") as unknown as {
      select: (s: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Task | null }> } };
    }).select("*").eq("id", taskId).maybeSingle();
    return data ?? demo.demoTasks.find((t) => t.id === taskId) ?? null;
  } catch {
    return demo.demoTasks.find((t) => t.id === taskId) ?? null;
  }
}

export async function createTask(input: {
  title: string;
  assigneeId?: string;
  departmentId?: string;
  linkedKpiId?: string;
  linkedActionPlanId?: string;
  actionMetricId?: string;
  actionTargetValue?: number;
  actionActualValue?: number;
  taskWeight?: number;
  progressUnit?: string;
  dueDate?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  taskType?: "growth" | "maintenance" | "admin" | "urgent";
  sprintId?: string;
  storyPoints?: number;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const selectedMetric = input.actionMetricId
    ? executionDemoActionMetrics.find((metric) => metric.id === input.actionMetricId) ??
      demo.demoActionMetrics.find((metric) => metric.id === input.actionMetricId)
    : null;
  const selectedPlan = (input.linkedActionPlanId || selectedMetric?.action_plan_id)
    ? executionDemoActionPlans.find((plan) => plan.id === (input.linkedActionPlanId || selectedMetric?.action_plan_id)) ??
      demo.demoActionPlans.find((plan) => plan.id === (input.linkedActionPlanId || selectedMetric?.action_plan_id))
    : null;
  const linkedKpiId = input.linkedKpiId || selectedPlan?.linked_kpi_id || null;
  const linkedActionPlanId = input.linkedActionPlanId || selectedMetric?.action_plan_id || null;

  const payload = {
    company_id: context.companyId,
    title: input.title,
    assignee_id: input.assigneeId || null,
    department_id: input.departmentId || null,
    linked_kpi_id: linkedKpiId,
    linked_action_plan_id: linkedActionPlanId,
    action_metric_id: input.actionMetricId || null,
    action_target_value: input.actionTargetValue ?? null,
    action_actual_value: input.actionActualValue ?? null,
    task_weight: input.taskWeight ?? 1,
    progress_unit: input.progressUnit || null,
    due_date: input.dueDate || null,
    priority: input.priority || "normal",
    task_type: input.taskType || "growth",
    status: "todo",
    sprint_id: input.sprintId || null,
    story_points: input.storyPoints ?? null,
  };

  const newTask: Task = {
    id: genId("t"),
    company_id: context.companyId,
    title: input.title,
    description: null,
    assignee_id: input.assigneeId || null,
    reviewer_id: null,
    department_id: input.departmentId || null,
    project_id: null,
    linked_kpi_id: linkedKpiId,
    linked_action_plan_id: linkedActionPlanId,
    action_metric_id: input.actionMetricId || null,
    priority: (input.priority || "normal") as Task["priority"],
    task_type: (input.taskType || "growth") as Task["task_type"],
    status: "todo",
    due_date: input.dueDate || null,
    estimated_hours: null,
    actual_hours: null,
    action_target_value: input.actionTargetValue ?? null,
    action_actual_value: input.actionActualValue ?? null,
    task_weight: input.taskWeight ?? 1,
    progress_unit: input.progressUnit || null,
    quality_score: null,
    sla_score: null,
    sprint_id: input.sprintId || null,
    story_points: input.storyPoints ?? null,
    parent_task_id: null,
  };

  if (isLinkedToExecution({ linkedKpiId, linkedActionPlanId, actionMetricId: input.actionMetricId })) {
    executionDemoTasks.push(newTask);
    return;
  }

  if (shouldUseDemoStore()) {
    demo.demoTasks.push(newTask);
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    const tasksTable = db.from("tasks") as unknown as {
      insert: (values: Record<string, unknown>) => {
        select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
      };
    };
    const { data } = await tasksTable.insert(payload).select("id").single();
    await writeAuditLog({
      action: "task.create",
      entity: "tasks",
      entityId: data?.id ?? null,
      after: payload,
    });
  } catch (err) {
    console.warn("[createTask] DB write failed (demo mode?):", err);
  }
}

export async function recordTaskOutput(input: {
  taskId: string;
  outputType: string;
  value: number;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  try {
    const db = await getDbClientOrThrow();
    const outputsTable = db.from("task_outputs") as unknown as {
      insert: (values: Record<string, unknown>) => Promise<unknown>;
    };
    const tasksTable = db.from("tasks") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> };
    };

    await outputsTable.insert({
      task_id: input.taskId,
      output_type: input.outputType,
      value: input.value,
    });
    await tasksTable.update({ status: "done" }).eq("id", input.taskId);

    await writeAuditLog({
      action: "task.output.record",
      entity: "task_outputs",
      entityId: input.taskId,
      after: input,
    });
  } catch (err) {
    console.warn("[recordTaskOutput] DB write failed (demo mode?):", err);
  }
}

export async function updateTaskStatus(input: {
  taskId: string;
  status: "todo" | "in_progress" | "blocked" | "review" | "done" | "cancelled";
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const exIdx = executionTaskIndex(input.taskId);
  if (exIdx >= 0) {
    executionDemoTasks[exIdx] = { ...executionDemoTasks[exIdx], status: input.status };
    return;
  }

  if (shouldUseDemoStore()) {
    const idx = demoTaskIndex(input.taskId);
    if (idx >= 0) demo.demoTasks[idx] = { ...demo.demoTasks[idx], status: input.status };
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    const tasksTable = db.from("tasks") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    };

    await tasksTable.update({ status: input.status }).eq("id", input.taskId);
    await writeAuditLog({
      action: "task.status.update",
      entity: "tasks",
      entityId: input.taskId,
      after: { status: input.status },
    });
  } catch (err) {
    console.warn("[updateTaskStatus] DB write failed (demo mode?):", err);
  }
}

export async function updateTask(input: {
  taskId: string;
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  departmentId?: string | null;
  linkedKpiId?: string | null;
  linkedActionPlanId?: string | null;
  actionMetricId?: string | null;
  dueDate?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  taskType?: "growth" | "maintenance" | "admin" | "urgent";
  status?: "todo" | "in_progress" | "blocked" | "review" | "done" | "cancelled";
  estimatedHours?: number | null;
  actualHours?: number | null;
  sprintId?: string | null;
  storyPoints?: number | null;
  actionTargetValue?: number | null;
  actionActualValue?: number | null;
  taskWeight?: number | null;
  progressUnit?: string | null;
  qualityScore?: number | null;
  slaScore?: number | null;
  blockedReason?: string | null;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.assigneeId !== undefined) payload.assignee_id = input.assigneeId || null;
  if (input.departmentId !== undefined) payload.department_id = input.departmentId || null;
  if (input.linkedKpiId !== undefined) payload.linked_kpi_id = input.linkedKpiId || null;
  if (input.linkedActionPlanId !== undefined) payload.linked_action_plan_id = input.linkedActionPlanId || null;
  if (input.actionMetricId !== undefined) payload.action_metric_id = input.actionMetricId || null;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.taskType !== undefined) payload.task_type = input.taskType;
  if (input.status !== undefined) payload.status = input.status;
  if (input.estimatedHours !== undefined) payload.estimated_hours = input.estimatedHours;
  if (input.actualHours !== undefined) payload.actual_hours = input.actualHours;
  if (input.sprintId !== undefined) payload.sprint_id = input.sprintId;
  if (input.storyPoints !== undefined) payload.story_points = input.storyPoints;
  if (input.actionTargetValue !== undefined) payload.action_target_value = input.actionTargetValue;
  if (input.actionActualValue !== undefined) payload.action_actual_value = input.actionActualValue;
  if (input.taskWeight !== undefined) payload.task_weight = input.taskWeight;
  if (input.progressUnit !== undefined) payload.progress_unit = input.progressUnit || null;
  if (input.qualityScore !== undefined) payload.quality_score = input.qualityScore;
  if (input.slaScore !== undefined) payload.sla_score = input.slaScore;
  if (input.blockedReason !== undefined) payload.blocked_reason = input.blockedReason || null;

  if (Object.keys(payload).length === 0) return;

  const exIdx = executionTaskIndex(input.taskId);
  if (exIdx >= 0) {
    executionDemoTasks[exIdx] = { ...executionDemoTasks[exIdx], ...(payload as Partial<Task>) };
    return;
  }

  if (shouldUseDemoStore()) {
    const idx = demoTaskIndex(input.taskId);
    if (idx >= 0) demo.demoTasks[idx] = { ...demo.demoTasks[idx], ...(payload as Partial<Task>) };
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    const tasksTable = db.from("tasks") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    };
    await tasksTable.update(payload).eq("id", input.taskId);
    await writeAuditLog({
      action: "task.update",
      entity: "tasks",
      entityId: input.taskId,
      after: payload,
    });
  } catch (err) {
    console.warn("[updateTask] DB write failed (demo mode?):", err);
  }
}

export async function bulkUpdateTaskStatus(input: {
  taskIds: string[];
  status: "todo" | "in_progress" | "blocked" | "review" | "done" | "cancelled";
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId || input.taskIds.length === 0) return;

  const executionIds = new Set(input.taskIds);
  let touchedExecution = false;
  for (let i = 0; i < executionDemoTasks.length; i++) {
    if (executionIds.has(executionDemoTasks[i].id)) {
      executionDemoTasks[i] = { ...executionDemoTasks[i], status: input.status };
      touchedExecution = true;
    }
  }
  if (touchedExecution && input.taskIds.every((id) => executionTaskIndex(id) >= 0)) return;

  if (shouldUseDemoStore()) {
    const ids = new Set(input.taskIds);
    for (let i = 0; i < demo.demoTasks.length; i++) {
      if (ids.has(demo.demoTasks[i].id)) {
        demo.demoTasks[i] = { ...demo.demoTasks[i], status: input.status };
      }
    }
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    const tasksTable = db.from("tasks") as unknown as {
      update: (values: Record<string, unknown>) => { in: (col: string, vals: string[]) => Promise<unknown> };
    };
    await tasksTable.update({ status: input.status }).in("id", input.taskIds);
    await writeAuditLog({
      action: "task.bulk_status_update",
      entity: "tasks",
      entityId: input.taskIds.join(","),
      after: { status: input.status, count: input.taskIds.length },
    });
  } catch (err) {
    console.warn("[bulkUpdateTaskStatus] DB write failed (demo mode?):", err);
  }
}

// ============================================
// SPRINT MANAGEMENT
// ============================================

export async function listSprints() {
  return withDemoFallback(demo.demoSprints, async (db) => {
    try {
      const { data, error } = await db.from("sprints").select("*").order("created_at");
      if (error) return demo.demoSprints;
      return data ?? [];
    } catch {
      return demo.demoSprints;
    }
  });
}

export async function createSprint(input: {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return null;

  if (shouldUseDemoStore()) {
    const newSprint: Sprint = {
      id: genId("sp"),
      company_id: context.companyId,
      name: input.name,
      goal: input.goal || null,
      start_date: input.startDate,
      end_date: input.endDate,
      status: "planning",
      capacity: input.capacity || 0,
      velocity: null,
      completed_points: null,
      carry_over_points: null,
      completion_rate: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      retrospective: null,
    };
    demo.demoSprints.push(newSprint);
    return newSprint;
  }

  try {
    const db = await getDbClientOrThrow();
    const table = db.from("sprints") as unknown as {
      insert: (values: Record<string, unknown>) => { select: (s: string) => { single: () => Promise<{ data: unknown }> } };
    };

    const { data } = await table.insert({
      company_id: context.companyId,
      name: input.name,
      goal: input.goal || null,
      start_date: input.startDate,
      end_date: input.endDate,
      status: "planning",
      capacity: input.capacity || 0,
    }).select("*").single();

    await writeAuditLog({
      action: "sprint.create",
      entity: "sprints",
      entityId: (data as Record<string, string>)?.id,
      after: { name: input.name },
    });

    return data as import("@/types/domain").Sprint | null;
  } catch (err) {
    console.warn("[createSprint] DB write failed (demo mode?):", err);
    return null;
  }
}

export async function updateSprintStatus(input: {
  sprintId: string;
  status: "planning" | "active" | "completed";
  metrics?: {
    velocity?: number;
    completedPoints?: number;
    carryOverPoints?: number;
    completionRate?: number;
  };
  retrospective?: {
    went_well: string[];
    to_improve: string[];
    action_items: string[];
  };
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const payload: Record<string, unknown> = { status: input.status };
  if (input.status === "completed") {
    payload.completed_at = new Date().toISOString();
    if (input.metrics) {
      payload.velocity = input.metrics.velocity ?? null;
      payload.completed_points = input.metrics.completedPoints ?? null;
      payload.carry_over_points = input.metrics.carryOverPoints ?? null;
      payload.completion_rate = input.metrics.completionRate ?? null;
    }
    if (input.retrospective) {
      payload.retrospective = input.retrospective;
    }
  }

  if (shouldUseDemoStore()) {
    const idx = demo.demoSprints.findIndex((s) => s.id === input.sprintId);
    if (idx >= 0) {
      demo.demoSprints[idx] = { ...demo.demoSprints[idx], ...(payload as Partial<Sprint>) };
    }
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    const table = db.from("sprints") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    };
    await table.update(payload).eq("id", input.sprintId);
    await writeAuditLog({
      action: `sprint.${input.status}`,
      entity: "sprints",
      entityId: input.sprintId,
      after: payload,
    });
  } catch (err) {
    console.warn("[updateSprintStatus] DB write failed (demo mode?):", err);
  }
}

export async function assignTaskToSprint(input: {
  taskId: string;
  sprintId: string | null;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  if (shouldUseDemoStore()) {
    const idx = demo.demoTasks.findIndex((t) => t.id === input.taskId);
    if (idx >= 0) demo.demoTasks[idx] = { ...demo.demoTasks[idx], sprint_id: input.sprintId };
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    const tasksTable = db.from("tasks") as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
    };
    await tasksTable.update({ sprint_id: input.sprintId }).eq("id", input.taskId);
    await writeAuditLog({
      action: input.sprintId ? "task.sprint.assign" : "task.sprint.remove",
      entity: "tasks",
      entityId: input.taskId,
      after: { sprint_id: input.sprintId },
    });
  } catch (err) {
    console.warn("[assignTaskToSprint] DB write failed (demo mode?):", err);
  }
}

// ============================================
// TASK RESULTS
// ============================================

export async function listTaskResults(taskId: string): Promise<TaskResult[]> {
  if (shouldUseDemoStore()) {
    return demo.demoTaskResults.filter((r) => r.task_id === taskId);
  }
  try {
    const db = await getDbClientOrThrow();
    const { data } = await (db.from("task_results") as unknown as {
      select: (s: string) => { eq: (c: string, v: string) => { order: (c: string, opt: { ascending: boolean }) => Promise<{ data: TaskResult[] }> } };
    }).select("*").eq("task_id", taskId).order("created_at", { ascending: false });
    return (data as TaskResult[]) ?? [];
  } catch {
    return demo.demoTaskResults.filter((r) => r.task_id === taskId);
  }
}

export async function listAllTaskResults(): Promise<TaskResult[]> {
  if (shouldUseDemoStore()) return demo.demoTaskResults.slice();
  try {
    const db = await getDbClientOrThrow();
    const { data } = await (db.from("task_results") as unknown as {
      select: (s: string) => Promise<{ data: TaskResult[] }>;
    }).select("*");
    return (data as TaskResult[]) ?? [];
  } catch {
    return demo.demoTaskResults.slice();
  }
}

export async function addTaskResult(input: {
  taskId: string;
  type: "link" | "file";
  url: string;
  label: string;
  note?: string | null;
}): Promise<TaskResult | null> {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return null;

  const newResult: TaskResult = {
    id: genId("tr"),
    task_id: input.taskId,
    type: input.type,
    url: input.url,
    label: input.label,
    note: input.note ?? null,
    created_at: new Date().toISOString(),
    created_by: context.employeeId,
  };

  if (shouldUseDemoStore()) {
    demo.demoTaskResults.push(newResult);
    return newResult;
  }

  try {
    const db = await getDbClientOrThrow();
    const table = db.from("task_results") as unknown as {
      insert: (v: Record<string, unknown>) => { select: (s: string) => { single: () => Promise<{ data: TaskResult | null }> } };
    };
    const { data } = await table.insert({
      company_id: context.companyId,
      task_id: input.taskId,
      type: input.type,
      url: input.url,
      label: input.label,
      note: input.note ?? null,
      created_by: context.employeeId,
    }).select("*").single();
    await writeAuditLog({
      action: "task_result.add",
      entity: "task_results",
      entityId: data?.id ?? null,
      after: input,
    });
    return data;
  } catch (err) {
    console.warn("[addTaskResult] DB write failed (demo mode?):", err);
    demo.demoTaskResults.push(newResult);
    return newResult;
  }
}

export async function deleteTaskResult(id: string) {
  if (shouldUseDemoStore()) {
    const idx = demo.demoTaskResults.findIndex((r) => r.id === id);
    if (idx >= 0) demo.demoTaskResults.splice(idx, 1);
    return;
  }
  try {
    const db = await getDbClientOrThrow();
    await (db.from("task_results") as unknown as {
      delete: () => { eq: (c: string, v: string) => Promise<unknown> };
    }).delete().eq("id", id);
  } catch (err) {
    console.warn("[deleteTaskResult] DB delete failed:", err);
  }
}
