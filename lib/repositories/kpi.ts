import * as demo from "@/lib/queries/demo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";

export async function listKpis() {
  return withDemoFallback(demo.demoKpis, async (db) => {
    const { data, error } = await db.from("kpis").select("*").order("created_at");
    if (error) throw error;
    return data ?? [];
  });
}

export async function listKpiTargets(period = "2026-04") {
  return withDemoFallback(
    demo.demoKpiTargets.filter((row) => row.period === period),
    async (db) => {
      const { data, error } = await db.from("kpi_targets").select("*").eq("period", period);
      if (error) throw error;
      return data ?? [];
    },
  );
}

export async function listKpiActuals(period = "2026-04") {
  return withDemoFallback(
    demo.demoKpiActuals.filter((row) => row.period === period),
    async (db) => {
      const { data, error } = await db.from("kpi_actuals").select("*").eq("period", period);
      if (error) throw error;
      return data ?? [];
    },
  );
}

export async function createKpi(input: {
  name: string;
  code: string;
  level: "company" | "department" | "team" | "employee";
  unit: string;
  targetFrequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  parentKpiId?: string;
  ownerDepartmentId?: string;
  ownerEmployeeId?: string;
  targetValue?: number;
  period?: string;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const kpiTable = db.from("kpis") as unknown as {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => { single: () => Promise<{ data: { id: string } | null }> };
    };
  };
  const targetsTable = db.from("kpi_targets") as unknown as {
    insert: (values: Record<string, unknown>) => Promise<unknown>;
  };

  const payload = {
    company_id: context.companyId,
    name: input.name,
    code: input.code || null,
    level: input.level,
    unit: input.unit || "%",
    target_frequency: input.targetFrequency,
    parent_kpi_id: input.parentKpiId || null,
    owner_department_id: input.ownerDepartmentId || null,
    owner_employee_id: input.ownerEmployeeId || null,
    weight: 1,
    active: true,
  };

  const { data } = await kpiTable.insert(payload).select("id").single();

  if (data?.id && input.targetValue != null) {
    await targetsTable.insert({
      kpi_id: data.id,
      period: input.period || "2026-04",
      target_value: input.targetValue,
    });
  }

  await writeAuditLog({
    action: "kpi.create",
    entity: "kpis",
    entityId: data?.id ?? null,
    after: payload,
  });
}

export async function recordKpiActual(input: { kpiId: string; period: string; actualValue: number }) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  const db = await getDbClientOrThrow();
  const actualsTable = db.from("kpi_actuals") as unknown as {
    upsert: (values: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
  };

  await actualsTable.upsert(
    {
      kpi_id: input.kpiId,
      period: input.period,
      actual_value: input.actualValue,
    },
    { onConflict: "kpi_id,period" },
  );

  await writeAuditLog({
    action: "kpi.actual.record",
    entity: "kpi_actuals",
    entityId: input.kpiId,
    after: input,
  });
}
