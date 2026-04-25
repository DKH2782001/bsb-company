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

export async function listAuditLogs() {
  return withDemoFallback(demo.demoAuditLogs, async (db) => {
    const { data, error } = await db
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });
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
