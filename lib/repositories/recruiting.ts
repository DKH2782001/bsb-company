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
}
