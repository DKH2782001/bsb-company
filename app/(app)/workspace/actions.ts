"use server";

import { revalidatePath } from "next/cache";
import { createDepartment, createEmployee } from "@/lib/repositories/org";
import { createKpi, recordKpiActual } from "@/lib/repositories/kpi";
import { createTask, recordTaskOutput } from "@/lib/repositories/operations";
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
