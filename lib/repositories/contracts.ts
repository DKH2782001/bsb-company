import { hasAnyRole } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/repositories/audit";
import {
  getAuthenticatedUser,
  getDbClientOrThrow,
  getUserContext,
  withDemoFallback,
} from "@/lib/repositories/shared";
import type {
  ContractAmendment,
  ContractStatus,
  ContractType,
  EmployeeDependent,
  EmployeeDocument,
  EmploymentContract,
} from "@/types/domain";

type RawDb = { from: (table: string) => any };

function table(db: unknown, name: string) {
  return (db as RawDb).from(name);
}

function toIsoDate(value?: string | null) {
  return value?.trim() ? value : null;
}

function normalizeContractStatus(status: ContractStatus, endsAt?: string | null) {
  if (!endsAt || status === "draft" || status === "terminated" || status === "renewed") {
    return status;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endsAt);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((end.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return "expired";
  if (diffDays <= 30 && status === "active") return "expiring_soon";
  return status;
}

function decorateContracts(rows: EmploymentContract[]) {
  return rows.map((row) => ({
    ...row,
    status: normalizeContractStatus(row.status, row.ends_at),
  }));
}

async function getContractAdminContext() {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) {
    throw new Error("Không xác định được công ty hiện tại.");
  }
  if (!hasAnyRole(context, ["ceo", "hr_admin"])) {
    throw new Error("Bạn không có quyền quản lý hợp đồng và hồ sơ.");
  }
  return { ...context, companyId: context.companyId };
}

async function getEmployeeMeta(service: unknown, employeeId: string, companyId: string) {
  const { data, error } = await table(service, "employees")
    .select("department_id, position_id")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? { department_id: null, position_id: null }) as {
    department_id: string | null;
    position_id: string | null;
  };
}

export async function listEmploymentContracts() {
  return withDemoFallback<EmploymentContract[]>([], async (db) => {
    const { data, error } = await table(db, "employment_contracts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return decorateContracts((data ?? []) as EmploymentContract[]);
  });
}

export async function listContractAmendments() {
  return withDemoFallback<ContractAmendment[]>([], async (db) => {
    const { data, error } = await table(db, "contract_amendments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ContractAmendment[];
  });
}

export async function listEmployeeDocuments() {
  return withDemoFallback<EmployeeDocument[]>([], async (db) => {
    const { data, error } = await table(db, "employee_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as EmployeeDocument[];
  });
}

export async function listEmployeeDependents() {
  return withDemoFallback<EmployeeDependent[]>([], async (db) => {
    const { data, error } = await table(db, "employee_dependents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as EmployeeDependent[];
  });
}

export async function saveEmploymentContract(input: {
  id?: string;
  employeeId: string;
  code?: string;
  contractType: ContractType;
  status: ContractStatus;
  startsAt: string;
  endsAt?: string;
  probationEndsAt?: string;
  signedAt?: string;
  baseSalary: number;
  currency: string;
  noticePeriodDays: number;
  workingHoursPerWeek: number;
  documentUrl?: string;
  notes?: string;
}) {
  const context = await getContractAdminContext();
  const db = await getDbClientOrThrow();
  const employeeMeta = await getEmployeeMeta(db, input.employeeId, context.companyId);
  const status = normalizeContractStatus(input.status, input.endsAt);
  const payload = {
    company_id: context.companyId,
    employee_id: input.employeeId,
    code: input.code?.trim() || null,
    contract_type: input.contractType,
    status,
    starts_at: input.startsAt,
    ends_at: toIsoDate(input.endsAt),
    probation_ends_at: toIsoDate(input.probationEndsAt),
    signed_at: toIsoDate(input.signedAt),
    base_salary: input.baseSalary,
    currency: input.currency.trim() || "VND",
    notice_period_days: input.noticePeriodDays,
    working_hours_per_week: input.workingHoursPerWeek,
    document_url: input.documentUrl?.trim() || null,
    notes: input.notes?.trim() || null,
    department_id: employeeMeta.department_id,
    position_id: employeeMeta.position_id,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data: before } = await table(db, "employment_contracts")
      .select("*")
      .eq("id", input.id)
      .eq("company_id", context.companyId)
      .maybeSingle();
    const { data, error } = await table(db, "employment_contracts")
      .update(payload)
      .eq("id", input.id)
      .eq("company_id", context.companyId)
      .select("id")
      .single();
    if (error) throw error;
    await writeAuditLog({
      action: "contract.update",
      entity: "employment_contracts",
      entityId: data?.id ?? input.id,
      before: (before ?? null) as Record<string, unknown> | null,
      after: payload,
    });
    return data?.id as string;
  }

  const { data, error } = await table(db, "employment_contracts")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  await writeAuditLog({
    action: "contract.create",
    entity: "employment_contracts",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id as string;
}

export async function saveContractAmendment(input: {
  contractId: string;
  effectiveFrom: string;
  summary: string;
  reason?: string;
  documentUrl?: string;
  signedAt?: string;
}) {
  const context = await getContractAdminContext();
  const db = await getDbClientOrThrow();
  const { data: contract, error: contractError } = await table(db, "employment_contracts")
    .select("id")
    .eq("id", input.contractId)
    .eq("company_id", context.companyId)
    .maybeSingle();
  if (contractError) throw contractError;
  if (!contract) throw new Error("Không tìm thấy hợp đồng.");

  const { data: latest } = await table(db, "contract_amendments")
    .select("amendment_no")
    .eq("contract_id", input.contractId)
    .order("amendment_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    company_id: context.companyId,
    contract_id: input.contractId,
    amendment_no: ((latest?.amendment_no as number | undefined) ?? 0) + 1,
    effective_from: input.effectiveFrom,
    changes: { summary: input.summary.trim() },
    reason: input.reason?.trim() || null,
    document_url: input.documentUrl?.trim() || null,
    signed_at: toIsoDate(input.signedAt),
  };

  const { data, error } = await table(db, "contract_amendments")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  await writeAuditLog({
    action: "contract.amendment.create",
    entity: "contract_amendments",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id as string;
}

export async function createEmployeeDocument(input: {
  employeeId: string;
  docType: string;
  label: string;
  storagePath: string;
  mimeType?: string;
  sizeBytes: number;
  expiresOn?: string;
}) {
  const context = await getContractAdminContext();
  const db = await getDbClientOrThrow();
  const payload = {
    company_id: context.companyId,
    employee_id: input.employeeId,
    doc_type: input.docType.trim(),
    label: input.label.trim(),
    storage_path: input.storagePath.trim(),
    mime_type: input.mimeType?.trim() || null,
    size_bytes: input.sizeBytes,
    expires_on: toIsoDate(input.expiresOn),
    uploaded_by: context.employeeId,
  };
  const { data, error } = await table(db, "employee_documents")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  await writeAuditLog({
    action: "employee.document.create",
    entity: "employee_documents",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id as string;
}

export async function deleteEmployeeDocument(id: string) {
  const context = await getContractAdminContext();
  const db = await getDbClientOrThrow();
  const { data: before } = await table(db, "employee_documents")
    .select("*")
    .eq("id", id)
    .eq("company_id", context.companyId)
    .maybeSingle();
  const { error } = await table(db, "employee_documents")
    .delete()
    .eq("id", id)
    .eq("company_id", context.companyId);
  if (error) throw error;
  await writeAuditLog({
    action: "employee.document.delete",
    entity: "employee_documents",
    entityId: id,
    before: (before ?? null) as Record<string, unknown> | null,
  });
}

export async function saveEmployeeDependent(input: {
  id?: string;
  employeeId: string;
  fullName: string;
  relationship: string;
  dateOfBirth?: string;
  nationalId?: string;
  taxCode?: string;
  startsOn?: string;
  endsOn?: string;
  notes?: string;
}) {
  const context = await getContractAdminContext();
  const db = await getDbClientOrThrow();
  const payload = {
    company_id: context.companyId,
    employee_id: input.employeeId,
    full_name: input.fullName.trim(),
    relationship: input.relationship.trim(),
    date_of_birth: toIsoDate(input.dateOfBirth),
    national_id: input.nationalId?.trim() || null,
    tax_code: input.taxCode?.trim() || null,
    starts_on: toIsoDate(input.startsOn),
    ends_on: toIsoDate(input.endsOn),
    notes: input.notes?.trim() || null,
  };

  if (input.id) {
    const { data: before } = await table(db, "employee_dependents")
      .select("*")
      .eq("id", input.id)
      .eq("company_id", context.companyId)
      .maybeSingle();
    const { data, error } = await table(db, "employee_dependents")
      .update(payload)
      .eq("id", input.id)
      .eq("company_id", context.companyId)
      .select("id")
      .single();
    if (error) throw error;
    await writeAuditLog({
      action: "employee.dependent.update",
      entity: "employee_dependents",
      entityId: data?.id ?? input.id,
      before: (before ?? null) as Record<string, unknown> | null,
      after: payload,
    });
    return data?.id as string;
  }

  const { data, error } = await table(db, "employee_dependents")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  await writeAuditLog({
    action: "employee.dependent.create",
    entity: "employee_dependents",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id as string;
}

export async function deleteEmployeeDependent(id: string) {
  const context = await getContractAdminContext();
  const db = await getDbClientOrThrow();
  const { data: before } = await table(db, "employee_dependents")
    .select("*")
    .eq("id", id)
    .eq("company_id", context.companyId)
    .maybeSingle();
  const { error } = await table(db, "employee_dependents")
    .delete()
    .eq("id", id)
    .eq("company_id", context.companyId);
  if (error) throw error;
  await writeAuditLog({
    action: "employee.dependent.delete",
    entity: "employee_dependents",
    entityId: id,
    before: (before ?? null) as Record<string, unknown> | null,
  });
}

export async function getContractPageAccess() {
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
    hasPeopleAdmin: hasAnyRole(context, ["ceo", "hr_admin"]),
    hasAnyEmployees: Boolean(data?.length),
  };
}
