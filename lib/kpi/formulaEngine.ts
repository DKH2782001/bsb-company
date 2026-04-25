import type { KpiFormulaDef } from "@/types/domain";

export type FormulaContext = {
  refs: Record<string, number>;
};

export function evaluateFormula(def: KpiFormulaDef, ctx: FormulaContext): number {
  if ("const" in def) return def.const;
  if ("ref" in def) return ctx.refs[def.ref] ?? 0;

  if ("op" in def) {
    switch (def.op) {
      case "sum":
        return def.args.reduce((acc, a) => acc + evaluateFormula(a, ctx), 0);
      case "sub":
        return def.args.reduce(
          (acc, a, i) => (i === 0 ? evaluateFormula(a, ctx) : acc - evaluateFormula(a, ctx)),
          0,
        );
      case "mul":
        return def.args.reduce((acc, a) => acc * evaluateFormula(a, ctx), 1);
      case "avg": {
        const vals = def.args.map((a) => evaluateFormula(a, ctx));
        return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      }
      case "weighted_avg": {
        let total = 0;
        let w = 0;
        for (const a of def.args) {
          const v = evaluateFormula(a, ctx);
          total += v;
          w += 1;
        }
        return w ? total / w : 0;
      }
      case "ratio": {
        const n = evaluateFormula(def.numerator, ctx);
        const d = evaluateFormula(def.denominator, ctx);
        return d === 0 ? 0 : n / d;
      }
      case "milestone": {
        const val = ctx.refs.__input ?? 0;
        let current = 0;
        for (const s of def.steps) {
          if (val >= s.at) current = s.value;
        }
        return current;
      }
      case "manual":
        return def.value;
    }
  }
  return 0;
}

export function describeFormula(def: KpiFormulaDef): string {
  if ("const" in def) return String(def.const);
  if ("ref" in def) return def.ref;
  if ("op" in def) {
    switch (def.op) {
      case "sum":
      case "sub":
      case "mul":
        return def.args.map(describeFormula).join(
          def.op === "sum" ? " + " : def.op === "sub" ? " − " : " × ",
        );
      case "avg":
        return `avg(${def.args.map(describeFormula).join(", ")})`;
      case "weighted_avg":
        return `weighted_avg(${def.args.map(describeFormula).join(", ")})`;
      case "ratio":
        return `${describeFormula(def.numerator)} / ${describeFormula(def.denominator)}`;
      case "milestone":
        return `milestone(${def.steps.map((s) => `${s.at}→${s.value}`).join(", ")})`;
      case "manual":
        return `manual(${def.value})`;
    }
  }
  return "?";
}
