import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listProjects() {
  return withDemoFallback(demo.demoProjects, async (db) => {
    const { data, error } = await db.from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function createProject(input: {
  name: string;
  code: string;
  ownerId?: string;
  budget: number;
  startsAt?: string;
  endsAt?: string;
  businessCase?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const projectsTable = db.from("projects") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };

  const payload = {
    company_id: context.companyId,
    name: input.name,
    code: input.code || null,
    owner_id: input.ownerId || null,
    budget: input.budget,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    business_case: input.businessCase || null,
    status: "draft",
  };

  const { data } = await projectsTable.insert(payload).select("id").single();
  await writeAuditLog({
    action: "project.create",
    entity: "projects",
    entityId: data?.id ?? null,
    after: payload,
  });
  return data?.id;
}

async function fetchProjectRow(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("projects") as unknown as {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
  const { data } = await table.select("*").eq("id", id).maybeSingle();
  return data;
}

export async function updateProject(input: {
  id: string;
  name: string;
  code?: string;
  ownerId?: string;
  budget: number;
  startsAt?: string;
  endsAt?: string;
  businessCase?: string;
  status: "draft" | "active" | "paused" | "done" | "cancelled";
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchProjectRow(input.id);

  const table = db.from("projects") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };

  const payload = {
    name: input.name,
    code: input.code || null,
    owner_id: input.ownerId || null,
    budget: input.budget,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    business_case: input.businessCase || null,
    status: input.status,
  };

  const { error } = await table.update(payload).eq("id", input.id);
  if (error) throw error;

  await writeAuditLog({
    action: "project.update",
    entity: "projects",
    entityId: input.id,
    before,
    after: payload,
  });
}

export async function softDeleteProject(id: string) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const before = await fetchProjectRow(id);

  const table = db.from("projects") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
  const { error } = await table.update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "project.cancel",
    entity: "projects",
    entityId: id,
    before,
    after: { status: "cancelled" },
  });
}
