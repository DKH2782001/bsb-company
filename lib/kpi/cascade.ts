import { evaluateFormula } from "@/lib/kpi/formulaEngine";
import type { Kpi, KpiActual, KpiCalcMode, KpiFormula, KpiTarget } from "@/types/domain";

export type KpiMetricGroup = "revenue" | "workload" | "ratio" | "financial" | "qualitative" | "other";

export type KpiRow = Kpi & {
  calcMode: KpiCalcMode;
  metricGroup: KpiMetricGroup;
  target: number | null;
  actual: number | null;
  completion: number | null;
  status: "green" | "yellow" | "red" | "na";
  directTarget: number | null;
  directActual: number | null;
  childTargetTotal: number | null;
  childActualTotal: number | null;
  isTargetAligned: boolean | null;
  targetAlignmentDelta: number | null;
};

export type KpiNode = KpiRow & { children: KpiNode[] };

const TARGET_EPSILON = 0.0001;

function normalizeText(input: string | null | undefined): string {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function sumNullable(values: Array<number | null>): number | null {
  if (!values.length) return null;
  if (values.some((value) => value == null)) return null;
  return values.reduce<number>((total, value) => total + Number(value), 0);
}

function toStatus(completion: number | null): KpiRow["status"] {
  if (completion == null || !Number.isFinite(completion)) return "na";
  if (completion >= 1) return "green";
  if (completion >= 0.85) return "yellow";
  return "red";
}

export function inferKpiCalcMode(kpi: Kpi): KpiCalcMode {
  if (kpi.calc_mode) return kpi.calc_mode;

  const unit = normalizeText(kpi.unit);
  const text = normalizeText([kpi.code, kpi.name, kpi.description, kpi.data_source].filter(Boolean).join(" "));

  if (
    includesAny(text, [
      "diem",
      "danh gia",
      "xep loai",
      "rating",
      "score",
      "qualitative",
    ])
  ) {
    return "manual";
  }

  if (
    includesAny(text, [
      "loi nhuan",
      "gross profit",
      "net profit",
      "margin",
      "bien loi nhuan",
      "ebit",
      "ebitda",
      "cogs",
      "opex",
      "aov",
      "cac",
      "cpl",
      "arpu",
      "ltv",
      "gp",
      "np",
    ])
  ) {
    return "formula";
  }

  if (
    unit === "%" ||
    includesAny(text, [
      "rate",
      "retention",
      "sla",
      "close rate",
      "conversion",
      "ty le",
      "ti le",
      "phan tram",
    ])
  ) {
    return "ratio";
  }

  if (
    unit === "vnd" ||
    includesAny(text, [
      "doanh thu",
      "revenue",
      "lead",
      "ticket",
      "don hang",
      "order",
      "so luong",
      "quantity",
      "volume",
      "count",
      "headcount",
      "san luong",
      "so bai",
      "output",
    ])
  ) {
    return "sum";
  }

  return "manual";
}

export function inferKpiMetricGroup(kpi: Kpi, calcMode = inferKpiCalcMode(kpi)): KpiMetricGroup {
  const unit = normalizeText(kpi.unit);
  const text = normalizeText([kpi.code, kpi.name, kpi.description, kpi.data_source].filter(Boolean).join(" "));

  if (calcMode === "manual") return "qualitative";
  if (calcMode === "ratio") return "ratio";

  if (
    includesAny(text, [
      "loi nhuan",
      "profit",
      "margin",
      "cogs",
      "opex",
      "aov",
      "cac",
      "cpl",
      "chi phi",
      "cost",
      "finance",
      "tai chinh",
      "gp",
      "np",
    ])
  ) {
    return "financial";
  }

  if (calcMode === "sum" && unit === "vnd") return "revenue";
  if (calcMode === "sum") return "workload";
  if (calcMode === "formula" && unit === "vnd") return "financial";

  return "other";
}

export function kpiMetricGroupLabel(group: KpiMetricGroup): string {
  switch (group) {
    case "revenue":
      return "Doanh thu";
    case "workload":
      return "Khối lượng";
    case "ratio":
      return "Tỷ lệ";
    case "financial":
      return "Tài chính phụ thuộc";
    case "qualitative":
      return "Đánh giá định tính";
    default:
      return "Khác";
  }
}

function isChildRollupCompatible(parent: KpiRow, child: KpiRow): boolean {
  return (
    parent.calcMode === "sum" &&
    child.calcMode === "sum" &&
    parent.metricGroup === child.metricGroup &&
    normalizeText(parent.unit) === normalizeText(child.unit)
  );
}

function buildFormulaRefs(
  kind: "target" | "actual",
  codeToId: Map<string, string>,
  resolveValue: (id: string, kind: "target" | "actual", trail: Set<string>) => number | null,
  trail: Set<string>,
) {
  const refs: Record<string, number> = {};
  codeToId.forEach((id, code) => {
    if (trail.has(id)) return;
    const value = resolveValue(id, kind, new Set(trail));
    if (value != null) refs[code] = value;
  });
  return refs;
}

export function buildKpiRows(
  kpis: Kpi[],
  targets: KpiTarget[],
  actuals: KpiActual[],
  formulas: KpiFormula[] = [],
): KpiRow[] {
  const kpiById = new Map(kpis.map((kpi) => [kpi.id, kpi]));
  const childrenByParent = new Map<string, string[]>();
  kpis.forEach((kpi) => {
    if (!kpi.parent_kpi_id) return;
    const children = childrenByParent.get(kpi.parent_kpi_id) ?? [];
    children.push(kpi.id);
    childrenByParent.set(kpi.parent_kpi_id, children);
  });

  const directTargets = new Map(targets.map((target) => [target.kpi_id, target.target_value]));
  const directActuals = new Map(actuals.map((actual) => [actual.kpi_id, actual.actual_value]));
  const formulaByKpiId = new Map(formulas.map((formula) => [formula.kpi_id, formula]));
  const codeToId = new Map(
    kpis
      .filter((kpi) => kpi.code)
      .map((kpi) => [String(kpi.code), kpi.id]),
  );

  const rowCache = new Map<string, KpiRow>();

  const resolveValue = (id: string, kind: "target" | "actual", trail: Set<string>): number | null => {
    if (trail.has(id)) return null;
    const row = resolveRow(id, trail);
    return kind === "target" ? row.target : row.actual;
  };

  const resolveRow = (id: string, trail = new Set<string>()): KpiRow => {
    const cached = rowCache.get(id);
    if (cached) return cached;

    const kpi = kpiById.get(id);
    if (!kpi) {
      throw new Error(`Unknown KPI id: ${id}`);
    }

    const nextTrail = new Set(trail);
    nextTrail.add(id);

    const calcMode = inferKpiCalcMode(kpi);
    const metricGroup = inferKpiMetricGroup(kpi, calcMode);
    const directTarget = directTargets.get(id) ?? null;
    const directActual = directActuals.get(id) ?? null;
    const childRows = (childrenByParent.get(id) ?? []).map((childId) => resolveRow(childId, nextTrail));
    const compatibleChildren = childRows.filter((child) =>
      isChildRollupCompatible(
        {
          ...kpi,
          calcMode,
          metricGroup,
          target: null,
          actual: null,
          completion: null,
          status: "na",
          directTarget: null,
          directActual: null,
          childTargetTotal: null,
          childActualTotal: null,
          isTargetAligned: null,
          targetAlignmentDelta: null,
        },
        child,
      ),
    );

    const childTargetTotal = compatibleChildren.length
      ? sumNullable(compatibleChildren.map((child) => child.target))
      : null;
    const childActualTotal = compatibleChildren.length
      ? sumNullable(compatibleChildren.map((child) => child.actual))
      : null;

    const formula = formulaByKpiId.get(id);
    let target: number | null = directTarget;
    let actual: number | null = directActual;

    if (calcMode === "sum" && compatibleChildren.length > 0) {
      target = childTargetTotal ?? target;
      actual = childActualTotal ?? actual;
    } else if ((calcMode === "ratio" || calcMode === "formula") && formula) {
      const targetRefs = buildFormulaRefs("target", codeToId, resolveValue, nextTrail);
      const actualRefs = buildFormulaRefs("actual", codeToId, resolveValue, nextTrail);
      target = directTarget ?? evaluateFormula(formula.definition, { refs: targetRefs });
      actual = directActual ?? evaluateFormula(formula.definition, { refs: actualRefs });
    }

    const completion =
      target != null && actual != null && Math.abs(target) > TARGET_EPSILON ? actual / target : null;
    const targetAlignmentDelta =
      directTarget != null && childTargetTotal != null ? directTarget - childTargetTotal : null;
    const isTargetAligned =
      targetAlignmentDelta == null ? null : Math.abs(targetAlignmentDelta) <= TARGET_EPSILON;

    const row: KpiRow = {
      ...kpi,
      calcMode,
      metricGroup,
      target,
      actual,
      completion,
      status: toStatus(completion),
      directTarget,
      directActual,
      childTargetTotal,
      childActualTotal,
      isTargetAligned,
      targetAlignmentDelta,
    };

    rowCache.set(id, row);
    return row;
  };

  return kpis.map((kpi) => resolveRow(kpi.id));
}

export function buildKpiTree(rows: KpiRow[]): KpiNode[] {
  const map = new Map<string, KpiNode>();
  rows.forEach((row) => map.set(row.id, { ...row, children: [] }));
  const roots: KpiNode[] = [];

  map.forEach((node) => {
    if (node.parent_kpi_id && map.has(node.parent_kpi_id)) {
      map.get(node.parent_kpi_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function simulateImpact(
  rows: KpiRow[],
  changes: Record<string, number>,
  formulas: KpiFormula[] = [],
): Record<string, { before: number; after: number; delta_pct: number }> {
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const formulaByKpiId = new Map(formulas.map((formula) => [formula.kpi_id, formula]));
  const childrenByParent = new Map<string, string[]>();
  const codeToId = new Map(
    rows
      .filter((row) => row.code)
      .map((row) => [String(row.code), row.id]),
  );

  rows.forEach((row) => {
    if (!row.parent_kpi_id) return;
    const children = childrenByParent.get(row.parent_kpi_id) ?? [];
    children.push(row.id);
    childrenByParent.set(row.parent_kpi_id, children);
  });

  const baseActuals = new Map<string, number | null>(rows.map((row) => [row.id, row.actual]));
  Object.entries(changes).forEach(([id, deltaPct]) => {
    const current = baseActuals.get(id);
    if (current == null) return;
    baseActuals.set(id, current * (1 + deltaPct / 100));
  });

  const actualCache = new Map<string, number | null>();

  const resolveActual = (id: string, trail = new Set<string>()): number | null => {
    const cached = actualCache.get(id);
    if (cached !== undefined) return cached;
    if (trail.has(id)) return rowById.get(id)?.actual ?? null;

    const row = rowById.get(id);
    if (!row) return null;

    const nextTrail = new Set(trail);
    nextTrail.add(id);

    let actual = baseActuals.get(id) ?? null;
    const children = (childrenByParent.get(id) ?? [])
      .map((childId) => rowById.get(childId))
      .filter((child): child is KpiRow => Boolean(child));
    const compatibleChildren = children.filter((child) => isChildRollupCompatible(row, child));

    if (row.calcMode === "sum" && compatibleChildren.length > 0) {
      actual = sumNullable(compatibleChildren.map((child) => resolveActual(child.id, nextTrail)));
    } else if ((row.calcMode === "ratio" || row.calcMode === "formula") && formulaByKpiId.has(id)) {
      const refs: Record<string, number> = {};
      codeToId.forEach((refId, code) => {
        if (nextTrail.has(refId)) return;
        const value = resolveActual(refId, new Set(nextTrail));
        if (value != null) refs[code] = value;
      });
      actual = evaluateFormula(formulaByKpiId.get(id)!.definition, { refs });
    }

    actualCache.set(id, actual);
    return actual;
  };

  const output: Record<string, { before: number; after: number; delta_pct: number }> = {};

  rows.forEach((row) => {
    const before = row.actual ?? 0;
    const after = resolveActual(row.id) ?? 0;
    const delta_pct = before === 0 ? 0 : ((after - before) / before) * 100;
    output[row.id] = { before, after, delta_pct };
  });

  return output;
}
