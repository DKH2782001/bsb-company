import { hasAnyRole } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/repositories/audit";
import {
  getAuthenticatedUser,
  getDbClientOrThrow,
  getUserContext,
  withDemoFallback,
} from "@/lib/repositories/shared";
import type {
  OnboardingKind,
  OnboardingRun,
  OnboardingRunStatus,
  OnboardingRunTask,
  OnboardingTaskStatus,
  OnboardingTemplate,
  OnboardingTemplateTask,
} from "@/types/domain";

type RawDb = { from: (table: string) => any };

function table(db: unknown, name: string) {
  return (db as RawDb).from(name);
}

function toIsoDate(value?: string | null) {
  return value?.trim() ? value : null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function withDerivedTaskStatus(tasks: OnboardingRunTask[]) {
  const today = todayIso();
  return tasks.map((task) => {
    if (
      task.due_on &&
      (task.status === "pending" || task.status === "in_progress") &&
      task.due_on < today
    ) {
      return { ...task, status: "overdue" as OnboardingTaskStatus };
    }
    return task;
  });
}

async function getOnboardingContext() {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) {
    throw new Error("Không xác định được công ty hiện tại.");
  }
  return { ...context, companyId: context.companyId };
}

function canManageRuns(roles: string[]) {
  return roles.some((role) => ["ceo", "hr_admin", "dept_head"].includes(role));
}

export async function listOnboardingTemplates() {
  return withDemoFallback<OnboardingTemplate[]>([], async (db) => {
    const { data, error } = await table(db, "onboarding_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as OnboardingTemplate[];
  });
}

export async function listOnboardingTemplateTasks() {
  return withDemoFallback<OnboardingTemplateTask[]>([], async (db) => {
    const { data, error } = await table(db, "onboarding_template_tasks")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as OnboardingTemplateTask[];
  });
}

export async function listOnboardingRuns() {
  return withDemoFallback<OnboardingRun[]>([], async (db) => {
    const { data, error } = await table(db, "onboarding_runs")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as OnboardingRun[];
  });
}

export async function listOnboardingRunTasks() {
  return withDemoFallback<OnboardingRunTask[]>([], async (db) => {
    const { data, error } = await table(db, "onboarding_run_tasks")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return withDerivedTaskStatus((data ?? []) as OnboardingRunTask[]);
  });
}

async function syncRunStatus(service: unknown, runId: string, companyId: string) {
  const { data, error } = await table(service, "onboarding_run_tasks")
    .select("status")
    .eq("run_id", runId)
    .eq("company_id", companyId);
  if (error) throw error;

  const statuses = ((data ?? []) as Array<{ status: OnboardingTaskStatus }>).map((row) => row.status);
  let nextStatus: OnboardingRunStatus = "not_started";
  let completedAt: string | null = null;

  if (statuses.length > 0 && statuses.every((status) => status === "completed" || status === "skipped")) {
    nextStatus = "completed";
    completedAt = new Date().toISOString();
  } else if (statuses.some((status) => status !== "pending")) {
    nextStatus = "in_progress";
  }

  const { error: updateError } = await table(service, "onboarding_runs")
    .update({
      status: nextStatus,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .eq("company_id", companyId);
  if (updateError) throw updateError;
}

export async function createOnboardingRun(input: {
  templateId: string;
  employeeId: string;
  kind: OnboardingKind;
  startedOn: string;
  targetDoneOn?: string;
  notes?: string;
}) {
  const context = await getOnboardingContext();
  if (!canManageRuns(context.roles)) {
    throw new Error("Bạn không có quyền tạo onboarding/offboarding run.");
  }

  const db = await getDbClientOrThrow();
  const { data: employee, error: employeeError } = await table(db, "employees")
    .select("id, manager_id")
    .eq("id", input.employeeId)
    .eq("company_id", context.companyId)
    .maybeSingle();
  if (employeeError) throw employeeError;
  if (!employee) throw new Error("Không tìm thấy nhân sự.");

  const { data: templateTasks, error: templateError } = await table(db, "onboarding_template_tasks")
    .select("*")
    .eq("template_id", input.templateId)
    .eq("company_id", context.companyId)
    .order("sort_order", { ascending: true });
  if (templateError) throw templateError;

  const tasks = (templateTasks ?? []) as OnboardingTemplateTask[];
  const maxOffset = tasks.reduce((max, task) => Math.max(max, task.due_offset_days), 0);
  const targetDoneOn =
    input.targetDoneOn?.trim() ||
    new Date(new Date(input.startedOn).getTime() + maxOffset * 86_400_000).toISOString().slice(0, 10);

  const payload = {
    company_id: context.companyId,
    template_id: input.templateId,
    employee_id: input.employeeId,
    kind: input.kind,
    status: "not_started" as OnboardingRunStatus,
    started_on: input.startedOn,
    target_done_on: targetDoneOn,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data: run, error: runError } = await table(db, "onboarding_runs")
    .insert(payload)
    .select("id")
    .single();
  if (runError) throw runError;

  if (tasks.length > 0) {
    const cloned = tasks.map((task) => {
      const dueOn = new Date(new Date(input.startedOn).getTime() + task.due_offset_days * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const ownerEmployeeId =
        task.default_owner_role === "dept_head"
          ? ((employee.manager_id as string | null) ?? null)
          : task.default_owner_role === "employee"
            ? input.employeeId
            : context.employeeId;

      return {
        company_id: context.companyId,
        run_id: run.id,
        template_task_id: task.id,
        sort_order: task.sort_order,
        title: task.title,
        description: task.description,
        owner_employee_id: ownerEmployeeId,
        due_on: dueOn,
        status: "pending" as OnboardingTaskStatus,
        notes: null,
      };
    });
    const { error: taskError } = await table(db, "onboarding_run_tasks").insert(cloned);
    if (taskError) throw taskError;
  }

  await writeAuditLog({
    action: "onboarding.run.create",
    entity: "onboarding_runs",
    entityId: run.id,
    after: payload,
  });
  return run.id as string;
}

export async function updateOnboardingRunTask(input: {
  taskId: string;
  status: OnboardingTaskStatus;
  notes?: string;
}) {
  const context = await getOnboardingContext();
  const db = await getDbClientOrThrow();
  const { data: task, error: taskError } = await table(db, "onboarding_run_tasks")
    .select("*")
    .eq("id", input.taskId)
    .eq("company_id", context.companyId)
    .maybeSingle();
  if (taskError) throw taskError;
  if (!task) throw new Error("Không tìm thấy task onboarding.");

  const isOwner = task.owner_employee_id && task.owner_employee_id === context.employeeId;
  if (!isOwner && !canManageRuns(context.roles)) {
    throw new Error("Bạn không có quyền cập nhật task này.");
  }

  const payload = {
    status: input.status,
    notes: input.notes?.trim() || task.notes || null,
    completed_at: input.status === "completed" ? new Date().toISOString() : null,
    completed_by: input.status === "completed" ? context.employeeId : null,
  };

  const { error } = await table(db, "onboarding_run_tasks")
    .update(payload)
    .eq("id", input.taskId)
    .eq("company_id", context.companyId);
  if (error) throw error;

  await syncRunStatus(db, task.run_id as string, context.companyId);
  await writeAuditLog({
    action: "onboarding.task.update",
    entity: "onboarding_run_tasks",
    entityId: input.taskId,
    before: task as Record<string, unknown>,
    after: payload,
  });
}

export async function getOnboardingPageAccess() {
  const db = await getDbClientOrThrow();
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  const { data } = await table(db, "employees")
    .select("id")
    .eq("company_id", context.companyId)
    .limit(1);
  return {
    companyId: context.companyId,
    roles: context.roles,
    viewerEmployeeId: context.employeeId,
    canManageRuns: canManageRuns(context.roles),
    hasAnyEmployees: Boolean(data?.length),
  };
}
