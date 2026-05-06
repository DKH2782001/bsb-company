import { headers } from "next/headers";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import * as demo from "@/lib/queries/demo";
import { getAuthenticatedUser, getServiceClient, getUserContext } from "@/lib/repositories/shared";
import type { AuditLog } from "@/types/domain";

export type AuditPayload = {
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
};

/** Đọc IP + user-agent từ request headers (best-effort, an toàn nếu chạy ngoài request context). */
async function readRequestMeta(): Promise<{ ip: string | null; ua: string | null; reqId: string | null }> {
  try {
    const h = await headers();
    // Thứ tự ưu tiên header: X-Forwarded-For (proxy/CDN) > X-Real-IP > CF-Connecting-IP
    const xff = h.get("x-forwarded-for");
    const ip = (xff?.split(",")[0]?.trim()) || h.get("x-real-ip") || h.get("cf-connecting-ip") || null;
    const ua = h.get("user-agent") || null;
    // Next.js gắn x-vercel-id; nếu không có thì sinh sau bằng crypto
    const reqId = h.get("x-request-id") || h.get("x-vercel-id") || null;
    return { ip, ua, reqId };
  } catch {
    // Gọi ngoài request scope (vd seed script) — không có headers
    return { ip: null, ua: null, reqId: null };
  }
}

export async function writeAuditLog(payload: AuditPayload) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const before = payload.before ?? null;
  const after = payload.meta ? { ...(payload.after ?? {}), meta: payload.meta } : (payload.after ?? null);
  const { ip, ua, reqId } = await readRequestMeta();

  // Demo mode: ghi vào array in-memory để UI /audit hiển thị log thật trong dev
  if (isDemoMode() || !hasSupabaseEnv()) {
    const entry: AuditLog = {
      id: `al_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      company_id: context.companyId,
      actor: context.employeeId,
      action: payload.action,
      entity: payload.entity,
      entity_id: payload.entityId ?? null,
      before,
      after,
      ip_address: ip,
      user_agent: ua,
      request_id: reqId,
      created_at: new Date().toISOString(),
    };
    demo.demoAuditLogs.unshift(entry);
    // Giới hạn 500 bản ghi gần nhất để không phình bộ nhớ
    if (demo.demoAuditLogs.length > 500) demo.demoAuditLogs.length = 500;
    return;
  }

  const service = await getServiceClient();
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
    ip_address: ip,
    user_agent: ua,
    request_id: reqId,
  });
}
