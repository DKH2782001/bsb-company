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

async function fetchDepartmentRow(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("departments") as unknown as {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
  const { data } = await table.select("*").eq("id", id).maybeSingle();
  return data;
}

async function fetchEmployeeRow(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("employees") as unknown as {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
  const { data } = await table.select("*").eq("id", id).maybeSingle();
  return data;
}

export async function createDepartment(input: {
  name: string;
  code?: string;
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
  return data?.id;
}

export async function updateDepartment(input: {
  id: string;
  name: string;
  code?: string;
  scope?: string;
  budgetMonthly: number;
  headEmployeeId?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchDepartmentRow(input.id);

  const table = db.from("departments") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };

  const payload = {
    name: input.name,
    code: input.code || null,
    scope: input.scope || null,
    budget_monthly: input.budgetMonthly,
    head_employee_id: input.headEmployeeId || null,
  };

  const { error } = await table.update(payload).eq("id", input.id);
  if (error) throw error;

  await writeAuditLog({
    action: "department.update",
    entity: "departments",
    entityId: input.id,
    before,
    after: payload,
  });
}

export async function deleteDepartment(id: string) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();

  const empCount = db.from("employees") as unknown as {
    select: (cols: string, opts: { count: "exact"; head: true }) => {
      eq: (c: string, v: string) => Promise<{ count: number | null }>;
    };
  };
  const { count } = await empCount.select("id", { count: "exact", head: true }).eq("department_id", id);
  if ((count ?? 0) > 0) {
    throw new Error(`Phòng ban đang có ${count} nhân sự, không thể xoá.`);
  }

  const before = await fetchDepartmentRow(id);

  const table = db.from("departments") as unknown as {
    delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
  const { error } = await table.delete().eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "department.delete",
    entity: "departments",
    entityId: id,
    before,
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
  return data?.id;
}

export async function updateEmployee(input: {
  id: string;
  fullName: string;
  email: string;
  departmentId?: string;
  managerId?: string;
  baseSalary: number;
  employmentType?: string;
  status?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchEmployeeRow(input.id);

  const table = db.from("employees") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };

  const payload = {
    full_name: input.fullName,
    email: input.email || null,
    department_id: input.departmentId || null,
    manager_id: input.managerId || null,
    base_salary: input.baseSalary,
    employment_type: input.employmentType || "fulltime",
    status: input.status || "active",
  };

  const { error } = await table.update(payload).eq("id", input.id);
  if (error) throw error;

  await writeAuditLog({
    action: "employee.update",
    entity: "employees",
    entityId: input.id,
    before,
    after: payload,
  });
}

export async function softDeleteEmployee(id: string) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchEmployeeRow(id);

  const table = db.from("employees") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
  const { error } = await table.update({ status: "terminated" }).eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "employee.terminate",
    entity: "employees",
    entityId: id,
    before,
    after: { status: "terminated" },
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
