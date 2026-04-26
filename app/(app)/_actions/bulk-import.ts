"use server";

import { revalidatePath } from "next/cache";
import { createEmployee } from "@/lib/repositories/org";
import { createKpi } from "@/lib/repositories/kpi";
import { createAccountingEntry } from "@/lib/repositories/finance";
import { createRequisition } from "@/lib/repositories/recruiting";

export type BulkImportResult = {
  inserted: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

function err(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Bulk import employees từ Excel/CSV. Mỗi row có: fullName, email, departmentId?, managerId?, baseSalary, employmentType? */
export async function bulkImportEmployeesAction(rows: Record<string, unknown>[]): Promise<BulkImportResult> {
  const errors: BulkImportResult["errors"] = [];
  let inserted = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      await createEmployee({
        fullName: String(r.fullName ?? ""),
        email: String(r.email ?? ""),
        departmentId: r.departmentId ? String(r.departmentId) : undefined,
        managerId: r.managerId ? String(r.managerId) : undefined,
        baseSalary: Number(r.baseSalary ?? 0),
        employmentType: r.employmentType ? String(r.employmentType) : "fulltime",
      });
      inserted++;
    } catch (e) {
      errors.push({ row: (r._rowIndex as number) ?? i + 2, message: err(e) });
    }
  }
  revalidatePath("/people");
  revalidatePath("/departments");
  return { inserted, failed: errors.length, errors };
}

/** Bulk import KPIs. Row: name, code, level, unit, targetFrequency, ownerDepartmentId?, ownerEmployeeId?, targetValue, period */
export async function bulkImportKpisAction(rows: Record<string, unknown>[]): Promise<BulkImportResult> {
  const errors: BulkImportResult["errors"] = [];
  let inserted = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      await createKpi({
        name: String(r.name ?? ""),
        code: String(r.code ?? ""),
        level: (String(r.level ?? "department") as "company" | "department" | "team" | "employee"),
        unit: String(r.unit ?? "%"),
        targetFrequency: (String(r.targetFrequency ?? "monthly") as "daily" | "weekly" | "monthly" | "quarterly" | "yearly"),
        parentKpiId: r.parentKpiId ? String(r.parentKpiId) : undefined,
        ownerDepartmentId: r.ownerDepartmentId ? String(r.ownerDepartmentId) : undefined,
        ownerEmployeeId: r.ownerEmployeeId ? String(r.ownerEmployeeId) : undefined,
        targetValue: Number(r.targetValue ?? 0),
        period: String(r.period ?? new Date().toISOString().slice(0, 7)),
      });
      inserted++;
    } catch (e) {
      errors.push({ row: (r._rowIndex as number) ?? i + 2, message: err(e) });
    }
  }
  revalidatePath("/kpi");
  return { inserted, failed: errors.length, errors };
}

/** Bulk import Accounting Entries. Row: accountCode, debit, credit, departmentId?, note?, entryDate */
export async function bulkImportAccountingEntriesAction(rows: Record<string, unknown>[]): Promise<BulkImportResult> {
  const errors: BulkImportResult["errors"] = [];
  let inserted = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      await createAccountingEntry({
        accountCode: String(r.accountCode ?? ""),
        debit: Number(r.debit ?? 0),
        credit: Number(r.credit ?? 0),
        departmentId: r.departmentId ? String(r.departmentId) : undefined,
        note: String(r.note ?? ""),
        entryDate: String(r.entryDate ?? new Date().toISOString().slice(0, 10)),
      });
      inserted++;
    } catch (e) {
      errors.push({ row: (r._rowIndex as number) ?? i + 2, message: err(e) });
    }
  }
  revalidatePath("/finance");
  revalidatePath("/finance/pnl");
  return { inserted, failed: errors.length, errors };
}

/** Bulk import Job Requisitions. Row: title, departmentId?, headcount, reason? */
export async function bulkImportRequisitionsAction(rows: Record<string, unknown>[]): Promise<BulkImportResult> {
  const errors: BulkImportResult["errors"] = [];
  let inserted = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      await createRequisition({
        title: String(r.title ?? ""),
        departmentId: r.departmentId ? String(r.departmentId) : undefined,
        headcount: Number(r.headcount ?? 1),
        reason: String(r.reason ?? ""),
      });
      inserted++;
    } catch (e) {
      errors.push({ row: (r._rowIndex as number) ?? i + 2, message: err(e) });
    }
  }
  revalidatePath("/recruiting");
  return { inserted, failed: errors.length, errors };
}
