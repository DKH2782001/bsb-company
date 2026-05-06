import assert from "node:assert/strict";
import { test } from "vitest";
import { evaluateFormula } from "../lib/kpi/formulaEngine";
import { buildKpiRows, simulateImpact } from "../lib/kpi/cascade";
import { computePayroll } from "../lib/compensation/ruleEngine";
import { buildBudgetVarianceRows, buildPnlSummary } from "../lib/finance/statements";
import { canAccessFinance, canManagePeople, type UserContext } from "../lib/auth/permissions";
import { demoAccounting, demoDepartments, demoKpiActuals, demoKpis, demoKpiTargets } from "../lib/queries/demo";
import type { Kpi, KpiActual, KpiTarget } from "../types/domain";

test("formula engine evaluates ratio and sum", () => {
  const value = evaluateFormula(
    {
      op: "ratio",
      numerator: { op: "sum", args: [{ const: 40 }, { const: 10 }] },
      denominator: { const: 10 },
    },
    { refs: {} },
  );

  assert.equal(value, 5);
});

test("kpi cascade simulates parent impact", () => {
  const rows = buildKpiRows(demoKpis, demoKpiTargets, demoKpiActuals);
  const simulated = simulateImpact(rows, { k201: 10 });
  assert.ok(simulated.k201.after > simulated.k201.before);
  assert.equal(simulated.k20.after, simulated.k20.before);
});

test("sum-mode parent revenue uses summed child actuals instead of average completion", () => {
  const kpis: Kpi[] = [
    {
      id: "rev-parent",
      company_id: "c1",
      code: "REV",
      name: "Doanh thu tháng",
      description: null,
      level: "company",
      owner_employee_id: null,
      owner_department_id: null,
      owner_team_id: null,
      unit: "VND",
      weight: 1,
      parent_kpi_id: null,
      data_source: "accounting",
      active: true,
      target_frequency: "monthly",
    },
    {
      id: "rev-a",
      company_id: "c1",
      code: "REV.A",
      name: "Doanh thu kênh A",
      description: null,
      level: "department",
      owner_employee_id: null,
      owner_department_id: "d1",
      owner_team_id: null,
      unit: "VND",
      weight: 1,
      parent_kpi_id: "rev-parent",
      data_source: "crm",
      active: true,
      target_frequency: "monthly",
    },
    {
      id: "rev-b",
      company_id: "c1",
      code: "REV.B",
      name: "Doanh thu kênh B",
      description: null,
      level: "department",
      owner_employee_id: null,
      owner_department_id: "d2",
      owner_team_id: null,
      unit: "VND",
      weight: 1,
      parent_kpi_id: "rev-parent",
      data_source: "crm",
      active: true,
      target_frequency: "monthly",
    },
    {
      id: "rev-c",
      company_id: "c1",
      code: "REV.C",
      name: "Doanh thu kênh C",
      description: null,
      level: "department",
      owner_employee_id: null,
      owner_department_id: "d3",
      owner_team_id: null,
      unit: "VND",
      weight: 1,
      parent_kpi_id: "rev-parent",
      data_source: "crm",
      active: true,
      target_frequency: "monthly",
    },
  ];

  const targets: KpiTarget[] = [
    { kpi_id: "rev-parent", period: "2026-04", target_value: 5_000_000_000 },
    { kpi_id: "rev-a", period: "2026-04", target_value: 1_000_000_000 },
    { kpi_id: "rev-b", period: "2026-04", target_value: 3_000_000_000 },
    { kpi_id: "rev-c", period: "2026-04", target_value: 1_000_000_000 },
  ];

  const actuals: KpiActual[] = [
    { kpi_id: "rev-a", period: "2026-04", actual_value: 1_000_000_000, completion_rate: 1, status: "green" },
    { kpi_id: "rev-b", period: "2026-04", actual_value: 3_000_000_000, completion_rate: 1, status: "green" },
    { kpi_id: "rev-c", period: "2026-04", actual_value: 2_000_000_000, completion_rate: 2, status: "green" },
  ];

  const rows = buildKpiRows(kpis, targets, actuals);
  const parent = rows.find((row) => row.id === "rev-parent");

  assert.ok(parent);
  assert.equal(parent?.calcMode, "sum");
  assert.equal(parent?.target, 5_000_000_000);
  assert.equal(parent?.actual, 6_000_000_000);
  assert.equal(parent?.completion, 1.2);
});

test("sum-mode revenue parent does not roll up mixed workload children", () => {
  const kpis: Kpi[] = [
    {
      id: "rev-parent",
      company_id: "c1",
      code: "REV",
      name: "Doanh thu tháng",
      description: null,
      level: "company",
      owner_employee_id: null,
      owner_department_id: null,
      owner_team_id: null,
      unit: "VND",
      weight: 1,
      parent_kpi_id: null,
      data_source: "accounting",
      active: true,
      target_frequency: "monthly",
    },
    {
      id: "lead-child",
      company_id: "c1",
      code: "MKT.LEADS",
      name: "Qualified leads",
      description: null,
      level: "department",
      owner_employee_id: null,
      owner_department_id: "d1",
      owner_team_id: null,
      unit: "lead",
      weight: 1,
      parent_kpi_id: "rev-parent",
      data_source: "crm",
      active: true,
      target_frequency: "monthly",
    },
  ];

  const targets: KpiTarget[] = [
    { kpi_id: "rev-parent", period: "2026-04", target_value: 5_000_000_000 },
    { kpi_id: "lead-child", period: "2026-04", target_value: 500 },
  ];

  const actuals: KpiActual[] = [
    { kpi_id: "lead-child", period: "2026-04", actual_value: 540, completion_rate: 1.08, status: "green" },
  ];

  const rows = buildKpiRows(kpis, targets, actuals);
  const parent = rows.find((row) => row.id === "rev-parent");

  assert.ok(parent);
  assert.equal(parent?.actual, null);
  assert.equal(parent?.completion, null);
});

test("payroll engine applies tiered bonus", () => {
  const payroll = computePayroll({
    base_salary: 20_000_000,
    allowance: 1_000_000,
    kpi_completion: 1.05,
    team_completion: 1,
    company_completion: 1,
  });

  assert.ok(payroll.kpi_bonus > 0);
  assert.ok(payroll.gross_pay > payroll.base_salary);
});

test("finance helpers compute budget variance and pnl", () => {
  const budgetRows = buildBudgetVarianceRows(demoDepartments, demoAccounting);
  const salesRow = budgetRows.find((row) => row.id === "d001");
  assert.ok(salesRow);
  assert.equal(salesRow?.actual, 420_000_000);

  const pnl = buildPnlSummary(demoAccounting, 560_000_000);
  assert.equal(pnl.revenue, 5_200_000_000);
  assert.equal(pnl.netProfit, 540_000_000);
});

test("permission guards reflect role capabilities", () => {
  const ceoContext: UserContext = {
    authUserId: "u1",
    companyId: "c1",
    employeeId: "e1",
    roles: ["ceo"],
    scopedDepartmentIds: [],
    scopedTeamIds: [],
  };
  const employeeContext: UserContext = {
    authUserId: "u2",
    companyId: "c1",
    employeeId: "e2",
    roles: ["employee"],
    scopedDepartmentIds: [],
    scopedTeamIds: [],
  };

  assert.equal(canAccessFinance(ceoContext), true);
  assert.equal(canManagePeople(ceoContext), true);
  assert.equal(canAccessFinance(employeeContext), false);
});
