import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listAccountingEntries() {
  return withDemoFallback(demo.demoAccounting, async (db) => {
    const { data, error } = await db
      .from("accounting_entries")
      .select("*")
      .order("entry_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createAccountingEntry(input: {
  accountCode: string;
  debit: number;
  credit: number;
  departmentId?: string;
  note?: string;
  entryDate?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const entriesTable = db.from("accounting_entries") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };

  const payload = {
    company_id: context.companyId,
    account_code: input.accountCode,
    debit: input.debit,
    credit: input.credit,
    department_id: input.departmentId || null,
    note: input.note || null,
    entry_date: input.entryDate || new Date().toISOString().slice(0, 10),
  };

  const { data } = await entriesTable.insert(payload).select("id").single();
  await writeAuditLog({
    action: "accounting_entry.create",
    entity: "accounting_entries",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id;
}

async function fetchAccountingEntryRow(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("accounting_entries") as unknown as {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
  const { data } = await table.select("*").eq("id", id).maybeSingle();
  return data;
}

export async function updateAccountingEntry(input: {
  id: string;
  accountCode: string;
  debit: number;
  credit: number;
  departmentId?: string;
  note?: string;
  entryDate: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchAccountingEntryRow(input.id);

  const table = db.from("accounting_entries") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };

  const payload = {
    account_code: input.accountCode,
    debit: input.debit,
    credit: input.credit,
    department_id: input.departmentId || null,
    note: input.note || null,
    entry_date: input.entryDate,
  };

  const { error } = await table.update(payload).eq("id", input.id);
  if (error) throw error;

  await writeAuditLog({
    action: "accounting_entry.update",
    entity: "accounting_entries",
    entityId: input.id,
    before,
    after: payload,
  });
}

export async function deleteAccountingEntry(id: string) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchAccountingEntryRow(id);

  const table = db.from("accounting_entries") as unknown as {
    delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
  const { error } = await table.delete().eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "accounting_entry.delete",
    entity: "accounting_entries",
    entityId: id,
    before,
  });
}

export async function saveDepartmentBudget(input: { departmentId: string; budgetMonthly: number }) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const departmentsTable = db.from("departments") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> };
  };

  await departmentsTable.update({ budget_monthly: input.budgetMonthly }).eq("id", input.departmentId);
  await writeAuditLog({
    action: "department.budget.update",
    entity: "departments",
    entityId: input.departmentId,
    after: input,
  });
}
