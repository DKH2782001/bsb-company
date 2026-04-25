"use server";

import { revalidatePath } from "next/cache";
import { createDepartment, createEmployee } from "@/lib/repositories/org";
import { createKpi, recordKpiActual } from "@/lib/repositories/kpi";
import { createTask, recordTaskOutput, updateTaskStatus, updateTask, bulkUpdateTaskStatus, createSprint, updateSprintStatus, assignTaskToSprint } from "@/lib/repositories/operations";
import { createAccountingEntry, saveDepartmentBudget } from "@/lib/repositories/finance";
import { createProject } from "@/lib/repositories/projects";
import { createRequisition } from "@/lib/repositories/recruiting";
import { createSop } from "@/lib/repositories/knowledge";
import { updateCompanySettings } from "@/lib/repositories/org";

export async function createDepartmentAction(formData: FormData) {
  await createDepartment({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    scope: String(formData.get("scope") ?? ""),
    budgetMonthly: Number(formData.get("budgetMonthly") ?? 0),
    headEmployeeId: String(formData.get("headEmployeeId") ?? ""),
  });
  revalidatePath("/departments");
  revalidatePath("/settings");
}

export async function createEmployeeAction(formData: FormData) {
  await createEmployee({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    managerId: String(formData.get("managerId") ?? ""),
    baseSalary: Number(formData.get("baseSalary") ?? 0),
    employmentType: String(formData.get("employmentType") ?? "fulltime"),
  });
  revalidatePath("/people");
  revalidatePath("/departments");
}

export async function createKpiAction(formData: FormData) {
  await createKpi({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    level: String(formData.get("level") ?? "department") as "company" | "department" | "team" | "employee",
    unit: String(formData.get("unit") ?? "%"),
    targetFrequency: String(formData.get("targetFrequency") ?? "monthly") as "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    parentKpiId: String(formData.get("parentKpiId") ?? ""),
    ownerDepartmentId: String(formData.get("ownerDepartmentId") ?? ""),
    ownerEmployeeId: String(formData.get("ownerEmployeeId") ?? ""),
    targetValue: Number(formData.get("targetValue") ?? 0),
    period: String(formData.get("period") ?? "2026-04"),
  });
  revalidatePath("/kpi");
}

export async function recordKpiActualAction(formData: FormData) {
  await recordKpiActual({
    kpiId: String(formData.get("kpiId") ?? ""),
    period: String(formData.get("period") ?? "2026-04"),
    actualValue: Number(formData.get("actualValue") ?? 0),
  });
  revalidatePath("/kpi");
}

export async function createTaskAction(formData: FormData) {
  await createTask({
    title: String(formData.get("title") ?? ""),
    assigneeId: String(formData.get("assigneeId") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    linkedKpiId: String(formData.get("linkedKpiId") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    priority: String(formData.get("priority") ?? "normal") as "low" | "normal" | "high" | "urgent",
    taskType: String(formData.get("taskType") ?? "growth") as "growth" | "maintenance" | "admin" | "urgent",
  });
  revalidatePath("/operations");
}

export async function recordTaskOutputAction(formData: FormData) {
  await recordTaskOutput({
    taskId: String(formData.get("taskId") ?? ""),
    outputType: String(formData.get("outputType") ?? "deliverable"),
    value: Number(formData.get("value") ?? 0),
  });
  revalidatePath("/operations");
}

export async function updateTaskStatusAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "todo") as
    | "todo"
    | "in_progress"
    | "blocked"
    | "review"
    | "done"
    | "cancelled";
  if (!taskId) return;
  await updateTaskStatus({ taskId, status });
  revalidatePath("/operations");
}

export async function updateTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  const input: Record<string, unknown> = { taskId };
  const title = formData.get("title");
  if (title !== null) input.title = String(title);
  const description = formData.get("description");
  if (description !== null) input.description = String(description) || null;
  const assigneeId = formData.get("assigneeId");
  if (assigneeId !== null) input.assigneeId = String(assigneeId) || null;
  const departmentId = formData.get("departmentId");
  if (departmentId !== null) input.departmentId = String(departmentId) || null;
  const linkedKpiId = formData.get("linkedKpiId");
  if (linkedKpiId !== null) input.linkedKpiId = String(linkedKpiId) || null;
  const dueDate = formData.get("dueDate");
  if (dueDate !== null) input.dueDate = String(dueDate) || null;
  const priority = formData.get("priority");
  if (priority !== null) input.priority = String(priority);
  const taskType = formData.get("taskType");
  if (taskType !== null) input.taskType = String(taskType);
  const status = formData.get("status");
  if (status !== null) input.status = String(status);
  const estimatedHours = formData.get("estimatedHours");
  if (estimatedHours !== null && String(estimatedHours) !== "") input.estimatedHours = Number(estimatedHours);
  const actualHours = formData.get("actualHours");
  if (actualHours !== null && String(actualHours) !== "") input.actualHours = Number(actualHours);
  const storyPoints = formData.get("storyPoints");
  if (storyPoints !== null && String(storyPoints) !== "") input.storyPoints = Number(storyPoints);
  const sprintId = formData.get("sprintId");
  if (sprintId !== null) input.sprintId = String(sprintId) || null;

  await updateTask(input as Parameters<typeof updateTask>[0]);
  revalidatePath("/operations");
}

export async function bulkUpdateTasksAction(formData: FormData) {
  const taskIdsRaw = String(formData.get("taskIds") ?? "");
  const status = String(formData.get("status") ?? "todo") as
    | "todo"
    | "in_progress"
    | "blocked"
    | "review"
    | "done"
    | "cancelled";
  const taskIds = taskIdsRaw.split(",").filter(Boolean);
  if (taskIds.length === 0) return;
  await bulkUpdateTaskStatus({ taskIds, status });
  revalidatePath("/operations");
}

export async function createAccountingEntryAction(formData: FormData) {
  await createAccountingEntry({
    accountCode: String(formData.get("accountCode") ?? ""),
    debit: Number(formData.get("debit") ?? 0),
    credit: Number(formData.get("credit") ?? 0),
    departmentId: String(formData.get("departmentId") ?? ""),
    note: String(formData.get("note") ?? ""),
    entryDate: String(formData.get("entryDate") ?? ""),
  });
  revalidatePath("/finance");
  revalidatePath("/finance/pnl");
}

export async function saveDepartmentBudgetAction(formData: FormData) {
  await saveDepartmentBudget({
    departmentId: String(formData.get("departmentId") ?? ""),
    budgetMonthly: Number(formData.get("budgetMonthly") ?? 0),
  });
  revalidatePath("/finance/budget");
  revalidatePath("/departments");
}

export async function createProjectAction(formData: FormData) {
  await createProject({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    ownerId: String(formData.get("ownerId") ?? ""),
    budget: Number(formData.get("budget") ?? 0),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    businessCase: String(formData.get("businessCase") ?? ""),
  });
  revalidatePath("/projects");
}

export async function createRequisitionAction(formData: FormData) {
  await createRequisition({
    title: String(formData.get("title") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    headcount: Number(formData.get("headcount") ?? 1),
    reason: String(formData.get("reason") ?? ""),
  });
  revalidatePath("/recruiting");
}

export async function createSopAction(formData: FormData) {
  await createSop({
    departmentId: String(formData.get("departmentId") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    published: formData.get("published") === "on",
  });
  revalidatePath("/knowledge");
}

export async function updateCompanySettingsAction(formData: FormData) {
  await updateCompanySettings({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    currency: String(formData.get("currency") ?? "VND"),
    timezone: String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh"),
  });
  revalidatePath("/settings");
}

// ============================================
// SPRINT MANAGEMENT ACTIONS
// ============================================

export async function createSprintAction(formData: FormData) {
  await createSprint({
    name: String(formData.get("name") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    capacity: Number(formData.get("capacity") ?? 0),
  });
  revalidatePath("/operations");
}

export async function startSprintAction(formData: FormData) {
  await updateSprintStatus({
    sprintId: String(formData.get("sprintId") ?? ""),
    status: "active",
  });
  revalidatePath("/operations");
}

export async function completeSprintAction(formData: FormData) {
  const retrospective = formData.get("retrospective");
  await updateSprintStatus({
    sprintId: String(formData.get("sprintId") ?? ""),
    status: "completed",
    metrics: {
      velocity: Number(formData.get("velocity") ?? 0),
      completedPoints: Number(formData.get("completedPoints") ?? 0),
      carryOverPoints: Number(formData.get("carryOverPoints") ?? 0),
      completionRate: Number(formData.get("completionRate") ?? 0),
    },
    retrospective: retrospective ? JSON.parse(String(retrospective)) : undefined,
  });
  revalidatePath("/operations");
}

export async function assignTaskToSprintAction(formData: FormData) {
  await assignTaskToSprint({
    taskId: String(formData.get("taskId") ?? ""),
    sprintId: formData.get("sprintId") ? String(formData.get("sprintId")) : null,
  });
  revalidatePath("/operations");
}
