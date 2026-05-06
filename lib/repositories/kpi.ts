import * as demo from "@/lib/queries/demo";
import {
  deactivateExecutionDemoKpi,
  executionDemoKpis,
  recordExecutionDemoKpiActual,
  upsertExecutionDemoKpi,
} from "@/lib/queries/kpiExecutionDemo";
import { writeAuditLog } from "@/lib/repositories/audit";
import { getAuthenticatedUser, getDbClientOrThrow, getUserContext, withDemoFallback } from "@/lib/repositories/shared";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import type { Kpi } from "@/types/domain";

function shouldUseDemoStore() {
  return isDemoMode() || !hasSupabaseEnv();
}

function isExecutionDemoKpi(id: string) {
  return executionDemoKpis.some((row) => row.id === id);
}

export async function listKpis() {
  return withDemoFallback([...demo.demoKpis, ...executionDemoKpis], async (db) => {
    const { data, error } = await db.from("kpis").select("*").order("created_at");
    if (error) throw error;
    const rows = (data ?? []) as Kpi[];
    const existingIds = new Set(rows.map((row) => row.id));
    return [...rows, ...executionDemoKpis.filter((row) => !existingIds.has(row.id))];
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

export async function listKpiFormulas() {
  return withDemoFallback(demo.demoKpiFormulas, async (db) => {
    const { data, error } = await db.from("kpi_formulas").select("kpi_id, formula_type, definition");
    if (error) throw error;
    return data ?? [];
  });
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

  const id = upsertExecutionDemoKpi({
    companyId: context.companyId,
    name: input.name,
    code: input.code,
    level: input.level,
    unit: input.unit,
    targetFrequency: input.targetFrequency,
    parentKpiId: input.parentKpiId,
    ownerDepartmentId: input.ownerDepartmentId,
    ownerEmployeeId: input.ownerEmployeeId,
    targetValue: input.targetValue,
    period: input.period,
  });

  if (shouldUseDemoStore() || input.period) {
    if (!demo.demoKpis.some((row) => row.id === id)) {
      demo.demoKpis.push({
        id,
        company_id: context.companyId,
        code: input.code || null,
        name: input.name,
        description: "Demo Result KPI. Actual lay tu import/manual, khong cong tu task.",
        level: input.level,
        owner_employee_id: input.ownerEmployeeId || null,
        owner_department_id: input.ownerDepartmentId || null,
        owner_team_id: null,
        unit: input.unit || "%",
        weight: 1,
        parent_kpi_id: input.parentKpiId || null,
        data_source: "manual_import",
        active: true,
        target_frequency: input.targetFrequency,
        calc_mode: "manual",
      });
    }
    if (input.targetValue != null && !demo.demoKpiTargets.some((row) => row.kpi_id === id && row.period === (input.period || "2026-04"))) {
      demo.demoKpiTargets.push({
        kpi_id: id,
        period: input.period || "2026-04",
        target_value: input.targetValue,
      });
    }
    return id;
  }

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

  return data?.id;
}

export async function recordKpiActual(input: { kpiId: string; period: string; actualValue: number }) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  if (shouldUseDemoStore() || isExecutionDemoKpi(input.kpiId)) {
    recordExecutionDemoKpiActual(input);
    const target = demo.demoKpiTargets.find((row) => row.kpi_id === input.kpiId && row.period === input.period)?.target_value ?? 0;
    const completionRate = target > 0 ? input.actualValue / target : 0;
    const status = completionRate >= 0.85 ? "green" : completionRate >= 0.6 ? "yellow" : "red";
    const next = {
      kpi_id: input.kpiId,
      period: input.period,
      actual_value: input.actualValue,
      completion_rate: completionRate,
      status: status as "green" | "yellow" | "red",
    };
    const idx = demo.demoKpiActuals.findIndex((row) => row.kpi_id === input.kpiId && row.period === input.period);
    if (idx >= 0) demo.demoKpiActuals[idx] = next;
    else demo.demoKpiActuals.push(next);
    return;
  }

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

async function fetchKpiRow(id: string) {
  const db = await getDbClientOrThrow();
  const table = db.from("kpis") as unknown as {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
  const { data } = await table.select("*").eq("id", id).maybeSingle();
  return data;
}

export async function updateKpi(input: {
  id: string;
  name: string;
  code?: string;
  level: "company" | "department" | "team" | "employee";
  unit: string;
  targetFrequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  parentKpiId?: string;
  ownerDepartmentId?: string;
  ownerEmployeeId?: string;
  weight: number;
  active: boolean;
}) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  if (shouldUseDemoStore() || isExecutionDemoKpi(input.id)) {
    upsertExecutionDemoKpi({
      id: input.id,
      companyId: context.companyId,
      name: input.name,
      code: input.code,
      level: input.level,
      unit: input.unit,
      targetFrequency: input.targetFrequency,
      parentKpiId: input.parentKpiId,
      ownerDepartmentId: input.ownerDepartmentId,
      ownerEmployeeId: input.ownerEmployeeId,
      weight: input.weight,
      active: input.active,
    });
    const idx = demo.demoKpis.findIndex((row) => row.id === input.id);
    if (idx >= 0) {
      demo.demoKpis[idx] = {
        ...demo.demoKpis[idx],
        name: input.name,
        code: input.code || null,
        level: input.level,
        unit: input.unit || "%",
        target_frequency: input.targetFrequency,
        parent_kpi_id: input.parentKpiId || null,
        owner_department_id: input.ownerDepartmentId || null,
        owner_employee_id: input.ownerEmployeeId || null,
        weight: input.weight,
        active: input.active,
      };
    }
    return;
  }

  const db = await getDbClientOrThrow();
  const before = await fetchKpiRow(input.id);

  const table = db.from("kpis") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };

  const payload = {
    name: input.name,
    code: input.code || null,
    level: input.level,
    unit: input.unit || "%",
    target_frequency: input.targetFrequency,
    parent_kpi_id: input.parentKpiId || null,
    owner_department_id: input.ownerDepartmentId || null,
    owner_employee_id: input.ownerEmployeeId || null,
    weight: input.weight,
    active: input.active,
  };

  const { error } = await table.update(payload).eq("id", input.id);
  if (error) throw error;

  await writeAuditLog({
    action: "kpi.update",
    entity: "kpis",
    entityId: input.id,
    before,
    after: payload,
  });
}

export async function softDeleteKpi(id: string) {
  const user = await getAuthenticatedUser();
  const context = await getUserContext(user);
  if (!context.companyId) return;

  if (shouldUseDemoStore() || isExecutionDemoKpi(id)) {
    deactivateExecutionDemoKpi(id);
    const idx = demo.demoKpis.findIndex((row) => row.id === id);
    if (idx >= 0) demo.demoKpis[idx] = { ...demo.demoKpis[idx], active: false };
    return;
  }

  const db = await getDbClientOrThrow();
  const before = await fetchKpiRow(id);

  const childCount = db.from("kpis") as unknown as {
    select: (cols: string, opts: { count: "exact"; head: true }) => {
      eq: (c: string, v: string) => Promise<{ count: number | null }>;
    };
  };
  const { count } = await childCount.select("id", { count: "exact", head: true }).eq("parent_kpi_id", id);
  if ((count ?? 0) > 0) {
    throw new Error(`KPI có ${count} KPI con đang trỏ tới — hãy xoá hoặc tách riêng các KPI con trước.`);
  }

  const table = db.from("kpis") as unknown as {
    update: (values: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
  };
  const { error } = await table.update({ active: false }).eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "kpi.deactivate",
    entity: "kpis",
    entityId: id,
    before,
    after: { active: false },
  });
}
