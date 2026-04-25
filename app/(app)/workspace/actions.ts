"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createDepartment,
  createEmployee,
  updateDepartment,
  deleteDepartment,
  updateEmployee,
  softDeleteEmployee,
} from "@/lib/repositories/org";
import { createKpi, recordKpiActual, updateKpi, softDeleteKpi } from "@/lib/repositories/kpi";
import { createTask, recordTaskOutput } from "@/lib/repositories/operations";
import {
  createAccountingEntry,
  saveDepartmentBudget,
  updateAccountingEntry,
  deleteAccountingEntry,
} from "@/lib/repositories/finance";
import { createProject, updateProject, softDeleteProject } from "@/lib/repositories/projects";
import { createRequisition, updateRequisition, cancelRequisition } from "@/lib/repositories/recruiting";
import { createSop, updateSop, deleteSop } from "@/lib/repositories/knowledge";
import { updateCompanySettings } from "@/lib/repositories/org";
import {
  employeeUpsertSchema,
  departmentUpsertSchema,
  kpiUpsertSchema,
  projectUpsertSchema,
  requisitionUpsertSchema,
  sopUpsertSchema,
  accountingEntryUpsertSchema,
  type EmployeeUpsertInput,
  type DepartmentUpsertInput,
  type KpiUpsertInput,
  type ProjectUpsertInput,
  type RequisitionUpsertInput,
  type SopUpsertInput,
  type AccountingEntryUpsertInput,
} from "@/lib/validation/schemas";
import { actionErr, actionOk, zodToFieldErrors, type ActionResult } from "@/lib/actions/result";

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

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function upsertEmployeeAction(
  raw: EmployeeUpsertInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed: EmployeeUpsertInput;
  try {
    parsed = employeeUpsertSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
    }
    return actionErr("Dữ liệu không hợp lệ");
  }

  try {
    if (parsed.id) {
      await updateEmployee({
        id: parsed.id,
        fullName: parsed.fullName,
        email: parsed.email,
        departmentId: parsed.departmentId,
        managerId: parsed.managerId,
        baseSalary: parsed.baseSalary,
        employmentType: parsed.employmentType,
        status: parsed.status,
      });
      revalidatePath("/people");
      revalidatePath(`/people/${parsed.id}`);
      revalidatePath("/departments");
      return actionOk({ id: parsed.id }, "Đã cập nhật nhân sự.");
    }
    const id = await createEmployee({
      fullName: parsed.fullName,
      email: parsed.email,
      departmentId: parsed.departmentId,
      managerId: parsed.managerId,
      baseSalary: parsed.baseSalary,
      employmentType: parsed.employmentType,
    });
    revalidatePath("/people");
    revalidatePath("/departments");
    return actionOk({ id }, "Đã tạo nhân sự mới.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể lưu nhân sự."));
  }
}

export async function deleteEmployeeAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID nhân sự");
  try {
    await softDeleteEmployee(id);
    revalidatePath("/people");
    revalidatePath(`/people/${id}`);
    revalidatePath("/departments");
    return actionOk(undefined, "Đã chuyển nhân sự sang trạng thái terminated.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể xoá nhân sự."));
  }
}

export async function upsertDepartmentAction(
  raw: DepartmentUpsertInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed: DepartmentUpsertInput;
  try {
    parsed = departmentUpsertSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
    }
    return actionErr("Dữ liệu không hợp lệ");
  }

  try {
    if (parsed.id) {
      await updateDepartment({
        id: parsed.id,
        name: parsed.name,
        code: parsed.code,
        scope: parsed.scope,
        budgetMonthly: parsed.budgetMonthly,
        headEmployeeId: parsed.headEmployeeId,
      });
      revalidatePath("/departments");
      revalidatePath(`/departments/${parsed.id}`);
      revalidatePath("/settings");
      return actionOk({ id: parsed.id }, "Đã cập nhật phòng ban.");
    }
    const id = await createDepartment({
      name: parsed.name,
      code: parsed.code,
      scope: parsed.scope,
      budgetMonthly: parsed.budgetMonthly,
      headEmployeeId: parsed.headEmployeeId,
    });
    revalidatePath("/departments");
    revalidatePath("/settings");
    return actionOk({ id }, "Đã tạo phòng ban mới.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể lưu phòng ban."));
  }
}

export async function deleteDepartmentAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID phòng ban");
  try {
    await deleteDepartment(id);
    revalidatePath("/departments");
    revalidatePath("/settings");
    return actionOk(undefined, "Đã xoá phòng ban.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể xoá phòng ban."));
  }
}

// ─── KPI ──────────────────────────────────────────────────────────────────
export async function upsertKpiAction(raw: KpiUpsertInput): Promise<ActionResult<{ id?: string }>> {
  let parsed;
  try {
    parsed = kpiUpsertSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
    return actionErr("Dữ liệu không hợp lệ");
  }

  try {
    if (parsed.id) {
      await updateKpi({
        id: parsed.id,
        name: parsed.name,
        code: parsed.code,
        level: parsed.level,
        unit: parsed.unit,
        targetFrequency: parsed.targetFrequency,
        parentKpiId: parsed.parentKpiId,
        ownerDepartmentId: parsed.ownerDepartmentId,
        ownerEmployeeId: parsed.ownerEmployeeId,
        weight: parsed.weight,
        active: parsed.active,
      });
      revalidatePath("/kpi");
      revalidatePath(`/kpi/${parsed.id}`);
      return actionOk({ id: parsed.id }, "Đã cập nhật KPI.");
    }
    await createKpi({
      name: parsed.name,
      code: parsed.code ?? "",
      level: parsed.level,
      unit: parsed.unit,
      targetFrequency: parsed.targetFrequency,
      parentKpiId: parsed.parentKpiId,
      ownerDepartmentId: parsed.ownerDepartmentId,
      ownerEmployeeId: parsed.ownerEmployeeId,
      targetValue: parsed.targetValue,
      period: parsed.period,
    });
    revalidatePath("/kpi");
    return actionOk(undefined, "Đã tạo KPI mới.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể lưu KPI."));
  }
}

export async function deleteKpiAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID KPI");
  try {
    await softDeleteKpi(id);
    revalidatePath("/kpi");
    return actionOk(undefined, "Đã chuyển KPI sang inactive.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể xoá KPI."));
  }
}

// ─── Project ──────────────────────────────────────────────────────────────
export async function upsertProjectAction(raw: ProjectUpsertInput): Promise<ActionResult<{ id?: string }>> {
  let parsed;
  try {
    parsed = projectUpsertSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
    return actionErr("Dữ liệu không hợp lệ");
  }

  try {
    if (parsed.id) {
      await updateProject({
        id: parsed.id,
        name: parsed.name,
        code: parsed.code,
        ownerId: parsed.ownerId,
        budget: parsed.budget,
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        businessCase: parsed.businessCase,
        status: parsed.status,
      });
      revalidatePath("/projects");
      revalidatePath(`/projects/${parsed.id}`);
      return actionOk({ id: parsed.id }, "Đã cập nhật dự án.");
    }
    const id = await createProject({
      name: parsed.name,
      code: parsed.code ?? "",
      ownerId: parsed.ownerId,
      budget: parsed.budget,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      businessCase: parsed.businessCase,
    });
    revalidatePath("/projects");
    return actionOk({ id }, "Đã tạo dự án.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể lưu dự án."));
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID dự án");
  try {
    await softDeleteProject(id);
    revalidatePath("/projects");
    return actionOk(undefined, "Đã huỷ dự án.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể huỷ dự án."));
  }
}

// ─── Requisition ──────────────────────────────────────────────────────────
export async function upsertRequisitionAction(
  raw: RequisitionUpsertInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed;
  try {
    parsed = requisitionUpsertSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
    return actionErr("Dữ liệu không hợp lệ");
  }

  try {
    if (parsed.id) {
      await updateRequisition({
        id: parsed.id,
        title: parsed.title,
        departmentId: parsed.departmentId,
        headcount: parsed.headcount,
        reason: parsed.reason,
        status: parsed.status,
      });
      revalidatePath("/recruiting");
      return actionOk({ id: parsed.id }, "Đã cập nhật requisition.");
    }
    const id = await createRequisition({
      title: parsed.title,
      departmentId: parsed.departmentId,
      headcount: parsed.headcount,
      reason: parsed.reason,
    });
    revalidatePath("/recruiting");
    return actionOk({ id }, "Đã mở requisition.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể lưu requisition."));
  }
}

export async function deleteRequisitionAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID");
  try {
    await cancelRequisition(id);
    revalidatePath("/recruiting");
    return actionOk(undefined, "Đã huỷ requisition.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể huỷ requisition."));
  }
}

// ─── SOP ──────────────────────────────────────────────────────────────────
export async function upsertSopAction(raw: SopUpsertInput): Promise<ActionResult<{ id?: string }>> {
  let parsed;
  try {
    parsed = sopUpsertSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
    return actionErr("Dữ liệu không hợp lệ");
  }

  try {
    if (parsed.id) {
      await updateSop({
        id: parsed.id,
        title: parsed.title,
        departmentId: parsed.departmentId,
        body: parsed.body,
        published: parsed.published,
      });
      revalidatePath("/knowledge");
      return actionOk({ id: parsed.id }, "Đã cập nhật SOP (tăng version).");
    }
    const id = await createSop({
      title: parsed.title,
      departmentId: parsed.departmentId,
      body: parsed.body,
      published: parsed.published,
    });
    revalidatePath("/knowledge");
    return actionOk({ id }, "Đã tạo SOP.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể lưu SOP."));
  }
}

export async function deleteSopAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID");
  try {
    await deleteSop(id);
    revalidatePath("/knowledge");
    return actionOk(undefined, "Đã xoá SOP.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể xoá SOP."));
  }
}

// ─── Accounting Entry ─────────────────────────────────────────────────────
export async function upsertAccountingEntryAction(
  raw: AccountingEntryUpsertInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed;
  try {
    parsed = accountingEntryUpsertSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
    return actionErr("Dữ liệu không hợp lệ");
  }

  try {
    if (parsed.id) {
      await updateAccountingEntry({
        id: parsed.id,
        accountCode: parsed.accountCode,
        debit: parsed.debit,
        credit: parsed.credit,
        departmentId: parsed.departmentId,
        note: parsed.note,
        entryDate: parsed.entryDate,
      });
    } else {
      await createAccountingEntry({
        accountCode: parsed.accountCode,
        debit: parsed.debit,
        credit: parsed.credit,
        departmentId: parsed.departmentId,
        note: parsed.note,
        entryDate: parsed.entryDate,
      });
    }
    revalidatePath("/finance");
    revalidatePath("/finance/pnl");
    revalidatePath("/finance/balance-sheet");
    revalidatePath("/finance/cashflow");
    return actionOk(
      parsed.id ? { id: parsed.id } : undefined,
      parsed.id ? "Đã cập nhật bút toán." : "Đã ghi bút toán mới.",
    );
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể lưu bút toán."));
  }
}

export async function deleteAccountingEntryAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID");
  try {
    await deleteAccountingEntry(id);
    revalidatePath("/finance");
    revalidatePath("/finance/pnl");
    return actionOk(undefined, "Đã xoá bút toán.");
  } catch (err) {
    return actionErr(errorMessage(err, "Không thể xoá bút toán."));
  }
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
