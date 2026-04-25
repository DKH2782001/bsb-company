import { getAuthenticatedUser, getServiceClient, getUserContext } from "@/lib/repositories/shared";

export type AuditPayload = {
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
};

export async function writeAuditLog(payload: AuditPayload) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const service = await getServiceClient();
  const before = payload.before ?? null;
  const after = payload.meta ? { ...(payload.after ?? {}), meta: payload.meta } : (payload.after ?? null);
  const auditTable = service.from("audit_logs") as unknown as {
    insert: (values: Record<string, unknown>) => Promise<unknown>;
  };

  await auditTable.insert({
    company_id: context.companyId,
    actor: context.employeeId,
    action: payload.action,
    entity: payload.entity,
    entity_id: payload.entityId ?? null,
    before,
    after,
  });
}
