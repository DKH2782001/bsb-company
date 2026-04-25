import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFormula } from "../lib/kpi/formulaEngine";
import { buildKpiRows, simulateImpact } from "../lib/kpi/cascade";
import { computePayroll } from "../lib/compensation/ruleEngine";
import { buildBudgetVarianceRows, buildPnlSummary } from "../lib/finance/statements";
import { canAccessFinance, canManagePeople } from "../lib/auth/permissions";
import { demoAccounting, demoDepartments, demoKpiActuals, demoKpis, demoKpiTargets } from "../lib/queries/demo";

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
  assert.notEqual(simulated.k20.after, simulated.k20.before);
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
  const ceoContext = {
    authUserId: "u1",
    companyId: "c1",
    employeeId: "e1",
    roles: ["ceo"] as const,
    scopedDepartmentIds: [],
    scopedTeamIds: [],
  };
  const employeeContext = {
    authUserId: "u2",
    companyId: "c1",
    employeeId: "e2",
    roles: ["employee"] as const,
    scopedDepartmentIds: [],
    scopedTeamIds: [],
  };

  assert.equal(canAccessFinance(ceoContext), true);
  assert.equal(canManagePeople(ceoContext), true);
  assert.equal(canAccessFinance(employeeContext), false);
});
