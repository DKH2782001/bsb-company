import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listTasks() {
  return withDemoFallback(demo.demoTasks, async (db) => {
    const { data, error } = await db.from("tasks").select("*").order("due_date");
    if (error) throw error;
    return data ?? [];
  });
}

export async function createTask(input: {
  title: string;
  assigneeId?: string;
  departmentId?: string;
  linkedKpiId?: string;
  dueDate?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  taskType?: "growth" | "maintenance" | "admin" | "urgent";
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const payload = {
    company_id: context.companyId,
    title: input.title,
    assignee_id: input.assigneeId || null,
    department_id: input.departmentId || null,
    linked_kpi_id: input.linkedKpiId || null,
    due_date: input.dueDate || null,
    priority: input.priority || "normal",
    task_type: input.taskType || "growth",
    status: "todo",
  };

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
  dueDate?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  taskType?: "growth" | "maintenance" | "admin" | "urgent";
  status?: "todo" | "in_progress" | "blocked" | "review" | "done" | "cancelled";
  estimatedHours?: number | null;
  actualHours?: number | null;
  sprintId?: string | null;
  storyPoints?: number | null;
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
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.taskType !== undefined) payload.task_type = input.taskType;
  if (input.status !== undefined) payload.status = input.status;
  if (input.estimatedHours !== undefined) payload.estimated_hours = input.estimatedHours;
  if (input.actualHours !== undefined) payload.actual_hours = input.actualHours;
  if (input.sprintId !== undefined) payload.sprint_id = input.sprintId;
  if (input.storyPoints !== undefined) payload.story_points = input.storyPoints;

  if (Object.keys(payload).length === 0) return;

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
