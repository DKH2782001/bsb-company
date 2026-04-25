import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listDepartments() {
  return withDemoFallback(demo.demoDepartments, async (db) => {
    const { data, error } = await db.from("departments").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  });
}

export async function listEmployees() {
  return withDemoFallback(demo.demoEmployees, async (db) => {
    const { data, error } = await db.from("employees").select("*").order("full_name");
    if (error) throw error;
    return data ?? [];
  });
}

export async function getCompany() {
  return withDemoFallback(demo.demoCompany, async (db) => {
    const { data, error } = await db.from("companies").select("*").limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return demo.demoCompany;
    return data;
  });
}

export async function createDepartment(input: {
  name: string;
  code: string;
  scope?: string;
  budgetMonthly: number;
  headEmployeeId?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const departmentsTable = db.from("departments") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };

  const payload = {
    company_id: context.companyId,
    name: input.name,
    code: input.code || null,
    scope: input.scope || null,
    budget_monthly: input.budgetMonthly,
    head_employee_id: input.headEmployeeId || null,
  };

  const { data } = await departmentsTable.insert(payload).select("id").single();
  await writeAuditLog({
    action: "department.create",
    entity: "departments",
    entityId: data?.id ?? null,
    after: payload,
  });
}

export async function createEmployee(input: {
  fullName: string;
  email: string;
  departmentId?: string;
  managerId?: string;
  baseSalary: number;
  employmentType?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const employeesTable = db.from("employees") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };

  const payload = {
    company_id: context.companyId,
    full_name: input.fullName,
    email: input.email || null,
    department_id: input.departmentId || null,
    manager_id: input.managerId || null,
    base_salary: input.baseSalary,
    employment_type: input.employmentType || "fulltime",
    status: "active",
  };

  const { data } = await employeesTable.insert(payload).select("id").single();
  await writeAuditLog({
    action: "employee.create",
    entity: "employees",
    entityId: data?.id ?? null,
    after: payload,
  });
}

export async function updateCompanySettings(input: {
  name: string;
  code: string;
  currency: string;
  timezone: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const companyTable = db.from("companies") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> };
  };

  await companyTable.update({
    name: input.name,
    code: input.code || null,
    currency: input.currency,
    timezone: input.timezone,
  }).eq("id", context.companyId);

  await writeAuditLog({
    action: "company.update",
    entity: "companies",
    entityId: context.companyId,
    after: input,
  });
}
