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

  const db = await getDbClientOrThrow();
  const tasksTable = db.from("tasks") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };

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

  const { data } = await tasksTable.insert(payload).select("id").single();
  await writeAuditLog({
    action: "task.create",
    entity: "tasks",
    entityId: data?.id ?? null,
    after: payload,
  });
}

export async function recordTaskOutput(input: {
  taskId: string;
  outputType: string;
  value: number;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

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
}
