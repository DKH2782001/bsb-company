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
