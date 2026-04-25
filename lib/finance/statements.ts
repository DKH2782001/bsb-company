import type { AccountingEntry, Department } from "@/types/domain";

export type BudgetVarianceRow = {
  id: string;
  name: string;
  planned: number;
  actual: number;
  variance: number;
  variance_pct: number;
};

export function buildBudgetVarianceRows(
  departments: Department[],
  entries: AccountingEntry[],
): BudgetVarianceRow[] {
  return departments.map((department) => {
    const actual = entries
      .filter(
        (entry) =>
          entry.department_id === department.id &&
          ["632", "641", "642"].includes(entry.account_code),
      )
      .reduce((sum, entry) => sum + (entry.debit ?? 0), 0);
    const planned = department.budget_monthly;
    const variance = actual - planned;
    const variance_pct = planned === 0 ? 0 : (variance / planned) * 100;

    return {
      id: department.id,
      name: department.name,
      planned,
      actual,
      variance,
      variance_pct,
    };
  });
}

export function buildPnlSummary(entries: AccountingEntry[], payrollCost: number) {
  const revenue = entries
    .filter((entry) => entry.account_code === "511")
    .reduce((sum, entry) => sum + (entry.credit ?? 0), 0);
  const cogs = entries
    .filter((entry) => entry.account_code === "632")
    .reduce((sum, entry) => sum + (entry.debit ?? 0), 0);
  const sellingExpense = entries
    .filter((entry) => entry.account_code === "641")
    .reduce((sum, entry) => sum + (entry.debit ?? 0), 0);
  const adminExpense = entries
    .filter((entry) => entry.account_code === "642")
    .reduce((sum, entry) => sum + (entry.debit ?? 0), 0);

  const grossProfit = revenue - cogs;
  const ebitda = grossProfit - sellingExpense - adminExpense;
  const netProfit = ebitda - payrollCost;

  return {
    revenue,
    cogs,
    sellingExpense,
    adminExpense,
    payrollCost,
    grossProfit,
    ebitda,
    netProfit,
  };
}
