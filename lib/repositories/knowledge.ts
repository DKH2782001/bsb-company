import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listSops() {
  return withDemoFallback(demo.demoSops, async (db) => {
    const { data, error } = await db.from("sop_documents").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createSop(input: {
  departmentId?: string;
  title: string;
  body?: string;
  published?: boolean;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const sopTable = db.from("sop_documents") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };

  const payload = {
    company_id: context.companyId,
    department_id: input.departmentId || null,
    title: input.title,
    body: input.body || null,
    published: Boolean(input.published),
    version: 1,
  };

  const { data } = await sopTable.insert(payload).select("id").single();
  await writeAuditLog({
    action: "sop.create",
    entity: "sop_documents",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id;
}

async function fetchSopRow(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("sop_documents") as unknown as {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
  const { data } = await table.select("*").eq("id", id).maybeSingle();
  return data;
}

export async function updateSop(input: {
  id: string;
  title: string;
  departmentId?: string;
  body?: string;
  published: boolean;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchSopRow(input.id);
  const prevVersion = typeof before?.version === "number" ? (before.version as number) : 1;

  const table = db.from("sop_documents") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };

  const payload = {
    title: input.title,
    department_id: input.departmentId || null,
    body: input.body || null,
    published: input.published,
    version: prevVersion + 1,
  };

  const { error } = await table.update(payload).eq("id", input.id);
  if (error) throw error;

  await writeAuditLog({
    action: "sop.update",
    entity: "sop_documents",
    entityId: input.id,
    before,
    after: payload,
  });
}

export async function deleteSop(id: string) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchSopRow(id);

  const table = db.from("sop_documents") as unknown as {
    delete: () => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
  const { error } = await table.delete().eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "sop.delete",
    entity: "sop_documents",
    entityId: id,
    before,
  });
}
