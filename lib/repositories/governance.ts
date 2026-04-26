import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listAlerts() {
  return withDemoFallback(demo.demoAlerts, async (db) => {
    const { data, error } = await db
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .is("resolved_at", null);
    if (error) throw error;
    return data ?? [];
  });
}

export async function listApprovals() {
  return withDemoFallback(demo.demoApprovals, async (db) => {
    const { data, error } = await db
      .from("approvals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function listReports() {
  return withDemoFallback(
    [
      { id: "r1", company_id: demo.DEMO_COMPANY_ID, kind: "kpi_company", period: "2026-04", payload: { title: "Báo cáo KPI công ty tháng 4/2026", size: "1.2 MB", format: "PDF", downloads: 4 }, generated_at: "2026-04-23T07:00:00Z" },
      { id: "r2", company_id: demo.DEMO_COMPANY_ID, kind: "finance_quarterly", period: "2026-Q1", payload: { title: "Báo cáo tài chính Q1/2026", size: "3.4 MB", format: "PDF", downloads: 12 }, generated_at: "2026-04-15T09:00:00Z" },
      { id: "r3", company_id: demo.DEMO_COMPANY_ID, kind: "payroll", period: "2026-03", payload: { title: "Payroll tháng 3/2026", size: "820 KB", format: "XLSX", downloads: 8 }, generated_at: "2026-04-05T16:30:00Z" },
    ],
    async (db) => {
      const { data, error } = await db.from("reports").select("*").order("generated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  );
}

export async function listReportSchedules() {
  return withDemoFallback(
    [
      { id: "s1", company_id: demo.DEMO_COMPANY_ID, kind: "KPI công ty", cron: "0 7 * * 1", recipients: ["ceo@bizos.demo", "cfo@bizos.demo"], active: true },
      { id: "s2", company_id: demo.DEMO_COMPANY_ID, kind: "Payroll", cron: "0 16 1 * *", recipients: ["hr@bizos.demo"], active: true },
      { id: "s3", company_id: demo.DEMO_COMPANY_ID, kind: "Cash flow", cron: "0 8 * * *", recipients: ["ceo@bizos.demo", "cfo@bizos.demo", "finance@bizos.demo"], active: true },
    ],
    async (db) => {
      const { data, error } = await db.from("report_schedules").select("*").order("kind");
      if (error) throw error;
      return data ?? [];
    },
  );
}

export type AuditLogFilter = {
  actorIds?: string[];
  actions?: string[];
  entities?: string[];
  from?: string | null;     // ISO datetime
  to?: string | null;       // ISO datetime
  search?: string;          // tìm trong action, entity, entity_id
  page?: number;            // 1-based
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 50;

/** Cũ — giữ tương thích (không filter, top-100). */
export async function listAuditLogs() {
  const { rows } = await queryAuditLogs({});
  return rows;
}

/** Có filter + pagination + total count. Dùng cho trang /audit. */
export async function queryAuditLogs(filter: AuditLogFilter): Promise<{ rows: import("@/types/domain").AuditLog[]; total: number }> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(200, Math.max(10, filter.pageSize ?? DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  // Demo mode → filter trên array trong bộ nhớ
  return withDemoFallback(filterDemoLogs(demo.demoAuditLogs, filter, offset, pageSize), async (db) => {
    let q = db.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });

    if (filter.actorIds?.length) q = q.in("actor", filter.actorIds);
    if (filter.actions?.length) q = q.in("action", filter.actions);
    if (filter.entities?.length) q = q.in("entity", filter.entities);
    if (filter.from) q = q.gte("created_at", filter.from);
    if (filter.to) q = q.lte("created_at", filter.to);
    if (filter.search) {
      // ilike trên 3 cột
      const s = `%${filter.search}%`;
      q = q.or(`action.ilike.${s},entity.ilike.${s},entity_id.ilike.${s}`);
    }

    q = q.range(offset, offset + pageSize - 1);

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      rows: (data ?? []) as import("@/types/domain").AuditLog[],
      total: count ?? data?.length ?? 0,
    };
  });
}

function filterDemoLogs(
  list: import("@/types/domain").AuditLog[],
  filter: AuditLogFilter,
  offset: number,
  pageSize: number,
): { rows: import("@/types/domain").AuditLog[]; total: number } {
  let rows = list.slice();
  if (filter.actorIds?.length) rows = rows.filter((r) => r.actor && filter.actorIds!.includes(r.actor));
  if (filter.actions?.length) rows = rows.filter((r) => filter.actions!.includes(r.action));
  if (filter.entities?.length) rows = rows.filter((r) => r.entity && filter.entities!.includes(r.entity));
  if (filter.from) rows = rows.filter((r) => r.created_at >= filter.from!);
  if (filter.to) rows = rows.filter((r) => r.created_at <= filter.to!);
  if (filter.search) {
    const q = filter.search.toLowerCase();
    rows = rows.filter((r) =>
      r.action.toLowerCase().includes(q) ||
      (r.entity ?? "").toLowerCase().includes(q) ||
      (r.entity_id ?? "").toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { rows: rows.slice(offset, offset + pageSize), total: rows.length };
}

/** Trả ra danh sách distinct action + entity để populate dropdown filter (demo + supabase đều an toàn). */
export async function listAuditFacets(): Promise<{ actions: string[]; entities: string[] }> {
  return withDemoFallback(
    {
      actions: Array.from(new Set(demo.demoAuditLogs.map((r) => r.action))).sort(),
      entities: Array.from(new Set(demo.demoAuditLogs.map((r) => r.entity).filter((e): e is string => !!e))).sort(),
    },
    async (db) => {
      // Lấy mẫu 1000 bản ghi gần nhất rồi distinct ở client — đủ cho dropdown
      const { data } = await db.from("audit_logs").select("action, entity").order("created_at", { ascending: false }).limit(1000);
      const list = (data ?? []) as { action: string; entity: string | null }[];
      return {
        actions: Array.from(new Set(list.map((r) => r.action))).sort(),
        entities: Array.from(new Set(list.map((r) => r.entity).filter((e): e is string => !!e))).sort(),
      };
    },
  );
}

export async function resolveAlert(alertId: string) {
  const [user, alerts] = await Promise.all([getAuthenticatedUser(), listAlerts()]);
  const context = await getUserContext(user);
  const alert = alerts.find((item) => item.id === alertId);
  if (!alert || !context.companyId) return;

  const db = await import("@/lib/repositories/shared").then((mod) => mod.getDbClientOrThrow());
  const alertsTable = db.from("alerts") as unknown as {
    update: (values: { resolved_at: string }) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<unknown>;
      };
    };
  };

  await alertsTable
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("company_id", context.companyId);

  await writeAuditLog({
    action: "alert.resolve",
    entity: "alerts",
    entityId: alertId,
    before: alert,
    after: { ...alert, resolved_at: new Date().toISOString() },
  });
}

export async function setApprovalStatus(approvalId: string, status: "approved" | "rejected" | "cancelled") {
  const [user, approvals] = await Promise.all([getAuthenticatedUser(), listApprovals()]);
  const context = await getUserContext(user);
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || !context.companyId) return;

  const db = await import("@/lib/repositories/shared").then((mod) => mod.getDbClientOrThrow());
  const approvalsTable = db.from("approvals") as unknown as {
    update: (values: { status: "approved" | "rejected" | "cancelled" }) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<unknown>;
      };
    };
  };

  await approvalsTable
    .update({ status })
    .eq("id", approvalId)
    .eq("company_id", context.companyId);

  await writeAuditLog({
    action: `approval.${status}`,
    entity: "approvals",
    entityId: approvalId,
    before: approval,
    after: { ...approval, status },
  });
}
