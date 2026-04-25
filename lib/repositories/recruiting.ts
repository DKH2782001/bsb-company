import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listRequisitions() {
  return withDemoFallback(demo.demoRequisitions, async (db) => {
    const { data, error } = await db.from("job_requisitions").select("*").order("opened_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createRequisition(input: {
  title: string;
  departmentId?: string;
  headcount: number;
  reason?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const reqTable = db.from("job_requisitions") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };

  const payload = {
    company_id: context.companyId,
    title: input.title,
    department_id: input.departmentId || null,
    headcount: input.headcount,
    reason: input.reason || null,
    status: "open",
  };

  const { data } = await reqTable.insert(payload).select("id").single();
  await writeAuditLog({
    action: "requisition.create",
    entity: "job_requisitions",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id;
}

async function fetchRequisitionRow(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("job_requisitions") as unknown as {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
  const { data } = await table.select("*").eq("id", id).maybeSingle();
  return data;
}

export async function updateRequisition(input: {
  id: string;
  title: string;
  departmentId?: string;
  headcount: number;
  reason?: string;
  status: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchRequisitionRow(input.id);

  const table = db.from("job_requisitions") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };

  const payload = {
    title: input.title,
    department_id: input.departmentId || null,
    headcount: input.headcount,
    reason: input.reason || null,
    status: input.status,
  };

  const { error } = await table.update(payload).eq("id", input.id);
  if (error) throw error;

  await writeAuditLog({
    action: "requisition.update",
    entity: "job_requisitions",
    entityId: input.id,
    before,
    after: payload,
  });
}

export async function cancelRequisition(id: string) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchRequisitionRow(id);

  const table = db.from("job_requisitions") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
  const { error } = await table
    .update({ status: "cancelled", closed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "requisition.cancel",
    entity: "job_requisitions",
    entityId: id,
    before,
    after: { status: "cancelled" },
  });
}
