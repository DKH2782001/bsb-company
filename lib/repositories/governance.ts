import * as demo from "@/lib/queries/demo";
import {
  appendApprovalComment,
  applyApprovalDecision,
  buildManualApprovalWorkflow,
  getCurrentApprovalStep,
  getApprovalWorkflow,
  insertApprovalStep,
  reassignCurrentApprovalStep,
  returnCurrentApprovalStep,
} from "@/lib/approvals/workflow";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import {
  listDemoApprovals,
  prependStoredDemoApproval,
  readStoredDemoApprovals,
  upsertStoredDemoApproval,
} from "@/lib/repositories/approval-demo-store";
import { writeAuditLog } from "@/lib/repositories/audit";
import { listEmployees } from "@/lib/repositories/org";
import { createNotification } from "@/lib/repositories/notifications";
import { getAuthenticatedUser, getUserContext, withDemoFallback } from "@/lib/repositories/shared";
import type { Approval } from "@/types/domain";

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
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId || context.companyId === demo.DEMO_COMPANY_ID || shouldUseDemoStore()) {
    return listDemoApprovals(demo.demoApprovals);
  }

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

function shouldUseDemoStore() {
  return isDemoMode() || !hasSupabaseEnv();
}

function newId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type CreateApprovalInput = {
  kind: string;
  title: string;
  payload: Record<string, unknown>;
  requestedBy?: string | null;
  workflowSteps?: Array<{
    label: string;
    approverRole?: string | null;
    approverEmployeeId: string | null;
  }>;
};

function employeeAuthUserId(employeeId: string | null | undefined, employees: Awaited<ReturnType<typeof listEmployees>>) {
  if (!employeeId) return null;
  const employee = employees.find((item) => item.id === employeeId);
  return employee?.auth_user_id ?? demo.DEMO_AUTH_USER_ID;
}

async function notifyApprovalAssignee(approval: Approval, reason: string) {
  const current = getCurrentApprovalStep(approval);
  if (!current?.approverEmployeeId) return;
  const employees = await listEmployees();
  const authUserId = employeeAuthUserId(current.approverEmployeeId, employees);
  if (!authUserId) return;
  await createNotification({
    authUserId,
    title: "Có request cần phê duyệt",
    body: `${reason}: ${approval.title} · Bước: ${current.label}`,
    link: `/approval/inbox?q=${encodeURIComponent(approval.title)}&status=pending&kind=all`,
  });
}

export async function createApprovalRequest(input: CreateApprovalInput) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  const companyId = context.companyId ?? demo.DEMO_COMPANY_ID;
  const requesterEmployeeId = input.requestedBy || context.employeeId || "e1";

  const now = new Date().toISOString();
  const approval: Approval = {
    id: newId("approval"),
    company_id: companyId,
    kind: input.kind,
    title: input.title.trim() || "Request phê duyệt mới",
    payload: input.payload,
    status: "pending",
    requested_by: requesterEmployeeId,
    decided_by: null,
    decided_at: null,
    decision_note: null,
    created_at: now,
  };
  const withWorkflow: Approval = {
    ...approval,
    payload: {
      ...approval.payload,
      approvalWorkflow: input.workflowSteps?.length
        ? buildManualApprovalWorkflow({
            approvalId: approval.id,
            steps: input.workflowSteps,
          })
        : getApprovalWorkflow(approval),
    },
  };

  if (shouldUseDemoStore() || !context.companyId || context.companyId === demo.DEMO_COMPANY_ID) {
    demo.demoApprovals.unshift(withWorkflow);
    await prependStoredDemoApproval(withWorkflow);
    await writeAuditLog({
      action: "approval.created",
      entity: "approvals",
      entityId: withWorkflow.id,
      before: null,
      after: withWorkflow,
    });
    await notifyApprovalAssignee(withWorkflow, "Request mới được tạo");
    return withWorkflow;
  }

  const db = await import("@/lib/repositories/shared").then((mod) => mod.getDbClientOrThrow());
  const approvalsTable = db.from("approvals") as unknown as {
    insert: (values: {
      id: string;
      company_id: string;
      kind: string;
      title: string;
      payload: Approval["payload"];
      status: Approval["status"];
      requested_by: string | null;
      created_at: string;
    }) => {
      select: () => {
        single: () => Promise<{ data: Approval | null; error: unknown }>;
      };
    };
  };

  const { data, error } = await approvalsTable
    .insert({
      id: withWorkflow.id,
      company_id: withWorkflow.company_id,
      kind: withWorkflow.kind,
      title: withWorkflow.title,
      payload: withWorkflow.payload,
      status: withWorkflow.status,
      requested_by: withWorkflow.requested_by,
      created_at: withWorkflow.created_at,
    })
    .select()
    .single();
  if (error) throw error;

  const created = data ?? withWorkflow;
  await writeAuditLog({
    action: "approval.created",
    entity: "approvals",
    entityId: created.id,
    before: null,
    after: created,
  });
  await notifyApprovalAssignee(created, "Request mới được tạo");
  return created;
}

async function persistApprovalChange(before: Approval, after: Approval, action: string) {
  const demoIdx = demo.demoApprovals.findIndex((item) => item.id === after.id);
  const storedDemoIdx = (await readStoredDemoApprovals()).findIndex((item) => item.id === after.id);
  if (shouldUseDemoStore() || demoIdx >= 0 || storedDemoIdx >= 0 || after.company_id === demo.DEMO_COMPANY_ID) {
    if (demoIdx >= 0) demo.demoApprovals[demoIdx] = after;
    await upsertStoredDemoApproval(after);
    await writeAuditLog({
      action,
      entity: "approvals",
      entityId: after.id,
      before,
      after,
    });
    return;
  }

  const db = await import("@/lib/repositories/shared").then((mod) => mod.getDbClientOrThrow());
  const approvalsTable = db.from("approvals") as unknown as {
    update: (values: { status: Approval["status"]; payload: Approval["payload"] }) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<unknown>;
      };
    };
  };

  await approvalsTable
    .update({ status: after.status, payload: after.payload })
    .eq("id", after.id)
    .eq("company_id", after.company_id);

  await writeAuditLog({
    action,
    entity: "approvals",
    entityId: after.id,
    before,
    after,
  });
}

export async function setApprovalStatus(
  approvalId: string,
  status: "approved" | "rejected" | "cancelled",
  note?: string,
) {
  const [user, approvals] = await Promise.all([getAuthenticatedUser(), listApprovals()]);
  const context = await getUserContext(user);
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || !context.companyId) return;

  const actorEmployeeId = context.employeeId ?? demo.DEMO_AUTH_USER_ID;
  const currentStep = getCurrentApprovalStep(approval);
  if (
    approval.status === "pending" &&
    status !== "cancelled" &&
    currentStep?.approverEmployeeId &&
    currentStep.approverEmployeeId !== actorEmployeeId
  ) {
    await writeAuditLog({
      action: "approval.decision_blocked_wrong_approver",
      entity: "approvals",
      entityId: approval.id,
      before: approval,
      after: {
        attemptedBy: actorEmployeeId,
        requiredApprover: currentStep.approverEmployeeId,
        status,
      },
    });
    return;
  }
  const after =
    status === "cancelled"
      ? {
          ...approval,
          status,
          payload: {
            ...approval.payload,
            approvalWorkflow: {
              ...getApprovalWorkflow(approval),
              currentStepId: null,
              steps: getApprovalWorkflow(approval).steps.map((step) =>
                step.status === "pending" ? { ...step, status: "cancelled" as const } : step,
              ),
            },
          },
          decided_by: actorEmployeeId,
          decided_at: new Date().toISOString(),
          decision_note: note?.trim() || null,
        }
      : applyApprovalDecision({
          approval,
          decision: status,
          actorEmployeeId,
          note,
        });

  await persistApprovalChange(approval, after, `approval.${status}`);
  if (after.status === "pending" && after.id !== approval.id) return;
  if (after.status === "pending") await notifyApprovalAssignee(after, "Đến lượt bạn duyệt");
}

export async function bulkApproveRequests(approvalIds: string[], note?: string) {
  const ids = Array.from(new Set(approvalIds.filter(Boolean)));
  if (!ids.length) return;
  const [user, approvals] = await Promise.all([getAuthenticatedUser(), listApprovals()]);
  const context = await getUserContext(user);
  if (!context.companyId) return;
  const actorEmployeeId = context.employeeId ?? demo.DEMO_AUTH_USER_ID;

  for (const approval of approvals) {
    if (!ids.includes(approval.id) || approval.status !== "pending") continue;
    const after = applyApprovalDecision({
      approval,
      decision: "approved",
      actorEmployeeId,
      note,
    });
    await persistApprovalChange(approval, after, "approval.bulk_approved");
    if (after.status === "pending") await notifyApprovalAssignee(after, "Đến lượt bạn duyệt");
  }
}

export async function reassignApproval(approvalId: string, toEmployeeId: string, note?: string) {
  const [user, approvals, employees] = await Promise.all([
    getAuthenticatedUser(),
    listApprovals(),
    listEmployees(),
  ]);
  const context = await getUserContext(user);
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || !context.companyId) return;
  const employee = employees.find((item) => item.id === toEmployeeId);
  const after = reassignCurrentApprovalStep({
    approval,
    toEmployeeId,
    toEmployeeName: employee?.full_name ?? null,
    actorEmployeeId: context.employeeId ?? demo.DEMO_AUTH_USER_ID,
    note,
    kind: "reassign",
  });
  await persistApprovalChange(approval, after, "approval.reassigned");
  await notifyApprovalAssignee(after, "Request được chuyển người duyệt");
}

export async function delegateApproval(approvalId: string, toEmployeeId: string, note?: string) {
  const [user, approvals, employees] = await Promise.all([
    getAuthenticatedUser(),
    listApprovals(),
    listEmployees(),
  ]);
  const context = await getUserContext(user);
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || !context.companyId) return;
  const employee = employees.find((item) => item.id === toEmployeeId);
  const after = reassignCurrentApprovalStep({
    approval,
    toEmployeeId,
    toEmployeeName: employee?.full_name ?? null,
    actorEmployeeId: context.employeeId ?? demo.DEMO_AUTH_USER_ID,
    note,
    kind: "delegate",
  });
  await persistApprovalChange(approval, after, "approval.delegated");
  await notifyApprovalAssignee(after, "Request được uỷ quyền cho bạn");
}

export async function returnApproval(approvalId: string, note?: string) {
  const [user, approvals] = await Promise.all([getAuthenticatedUser(), listApprovals()]);
  const context = await getUserContext(user);
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval) return;
  const after = returnCurrentApprovalStep({
    approval,
    actorEmployeeId: context.employeeId ?? demo.DEMO_AUTH_USER_ID,
    note,
  });
  await persistApprovalChange(approval, after, "approval.returned");
  await notifyApprovalAssignee(after, "Request duoc tra ve buoc truoc");
}

export async function addApprovalStep(
  approvalId: string,
  toEmployeeId: string,
  position: "before_current" | "after_current",
  note?: string,
) {
  const [user, approvals, employees] = await Promise.all([
    getAuthenticatedUser(),
    listApprovals(),
    listEmployees(),
  ]);
  const context = await getUserContext(user);
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || !toEmployeeId) return;
  const employee = employees.find((item) => item.id === toEmployeeId);
  const after = insertApprovalStep({
    approval,
    toEmployeeId,
    toEmployeeName: employee?.full_name ?? null,
    actorEmployeeId: context.employeeId ?? demo.DEMO_AUTH_USER_ID,
    position,
    note,
  });
  await persistApprovalChange(approval, after, "approval.step_added");
  await notifyApprovalAssignee(after, "Request co them nguoi duyet");
}

export async function commentApproval(approvalId: string, note: string) {
  const [user, approvals] = await Promise.all([getAuthenticatedUser(), listApprovals()]);
  const context = await getUserContext(user);
  const approval = approvals.find((item) => item.id === approvalId);
  if (!approval || !note.trim()) return;
  const after = appendApprovalComment({
    approval,
    actorEmployeeId: context.employeeId ?? demo.DEMO_AUTH_USER_ID,
    note,
  });
  await persistApprovalChange(approval, after, "approval.commented");
}
