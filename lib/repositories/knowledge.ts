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
}
