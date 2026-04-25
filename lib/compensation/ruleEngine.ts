export type ThresholdStep = { completion_min: number; multiplier: number };

export type BonusRule = {
  name: string;
  base_bonus_pct: number; // % of base salary that is "target bonus"
  thresholds: ThresholdStep[]; // sorted ascending
  team_multiplier?: number;
  company_multiplier?: number;
};

export const DEFAULT_BONUS_RULE: BonusRule = {
  name: "Default tiered bonus",
  base_bonus_pct: 15,
  thresholds: [
    { completion_min: 0, multiplier: 0 },
    { completion_min: 0.8, multiplier: 0.5 },
    { completion_min: 0.9, multiplier: 0.75 },
    { completion_min: 1.0, multiplier: 1.0 },
    { completion_min: 1.2, multiplier: 1.5 },
  ],
  team_multiplier: 1,
  company_multiplier: 1,
};

export function pickMultiplier(rule: BonusRule, completion: number): number {
  let m = 0;
  for (const step of rule.thresholds) {
    if (completion >= step.completion_min) m = step.multiplier;
  }
  return m;
}

export type PayrollBreakdown = {
  base_salary: number;
  allowance: number;
  commission: number;
  kpi_bonus: number;
  team_bonus: number;
  company_bonus: number;
  penalty: number;
  adjustment: number;
  gross_pay: number;
  net_pay: number;
  company_cost: number;
  multiplier_applied: number;
};

export type ComputePayrollInput = {
  base_salary: number;
  allowance?: number;
  commission?: number;
  kpi_completion: number; // 0..1.5 (e.g. 0.95 = đạt 95% KPI)
  team_completion?: number;
  company_completion?: number;
  penalty?: number;
  adjustment?: number;
  rule?: BonusRule;
};

export function computePayroll(input: ComputePayrollInput): PayrollBreakdown {
  const rule = input.rule ?? DEFAULT_BONUS_RULE;
  const mult = pickMultiplier(rule, input.kpi_completion);
  const kpi_bonus = input.base_salary * (rule.base_bonus_pct / 100) * mult;

  const team_bonus =
    input.team_completion != null && input.team_completion >= 1
      ? kpi_bonus * ((rule.team_multiplier ?? 1) - 1) +
        (input.base_salary * 0.02)
      : 0;

  const company_bonus =
    input.company_completion != null && input.company_completion >= 1
      ? input.base_salary * 0.03 * (rule.company_multiplier ?? 1)
      : 0;

  const allowance = input.allowance ?? 0;
  const commission = input.commission ?? 0;
  const penalty = input.penalty ?? 0;
  const adjustment = input.adjustment ?? 0;

  const gross_pay =
    input.base_salary + allowance + commission + kpi_bonus + team_bonus + company_bonus - penalty + adjustment;
  const net_pay = Math.round(gross_pay * 0.9); // giả lập trừ BHXH/thuế ~10%
  const company_cost = Math.round(gross_pay * 1.235); // +~23.5% cho BHXH doanh nghiệp

  return {
    base_salary: input.base_salary,
    allowance,
    commission,
    kpi_bonus: Math.round(kpi_bonus),
    team_bonus: Math.round(team_bonus),
    company_bonus: Math.round(company_bonus),
    penalty,
    adjustment,
    gross_pay: Math.round(gross_pay),
    net_pay: Math.round(net_pay),
    company_cost: Math.round(company_cost),
    multiplier_applied: mult,
  };
}
