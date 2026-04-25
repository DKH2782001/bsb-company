import type { Kpi, KpiActual, KpiTarget } from "@/types/domain";

export type KpiRow = Kpi & {
  target: number | null;
  actual: number | null;
  completion: number | null;
  status: "green" | "yellow" | "red" | "na";
};

export function buildKpiRows(
  kpis: Kpi[],
  targets: KpiTarget[],
  actuals: KpiActual[],
): KpiRow[] {
  const tMap = new Map(targets.map((t) => [t.kpi_id, t.target_value]));
  const aMap = new Map(actuals.map((a) => [a.kpi_id, a]));

  return kpis.map((k) => {
    const target = tMap.get(k.id) ?? null;
    const actualRow = aMap.get(k.id);
    const actual = actualRow?.actual_value ?? null;
    const completion = actualRow?.completion_rate ?? (target && actual ? actual / target : null);
    const status: KpiRow["status"] = completion == null
      ? "na"
      : completion >= 1
        ? "green"
        : completion >= 0.85
          ? "yellow"
          : "red";
    return { ...k, target, actual, completion, status };
  });
}

export type KpiNode = KpiRow & { children: KpiNode[] };

export function buildKpiTree(rows: KpiRow[]): KpiNode[] {
  const map = new Map<string, KpiNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
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
): Record<string, { before: number; after: number; delta_pct: number }> {
  // Ứng dụng đơn giản: áp delta vào KPI lá, rồi propagate lên parent bằng
  // tổng có trọng số (weight) của children.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const next = new Map<string, number>();
  rows.forEach((r) => next.set(r.id, r.actual ?? 0));

  // Áp thay đổi vào từng KPI lá (id → delta pct)
  Object.entries(changes).forEach(([id, deltaPct]) => {
    const current = next.get(id) ?? 0;
    next.set(id, current * (1 + deltaPct / 100));
  });

  // Tính lại KPI cha (dựa trên weighted sum của children)
  let changed = true;
  let guard = 10;
  while (changed && guard--) {
    changed = false;
    rows.forEach((r) => {
      const children = rows.filter((c) => c.parent_kpi_id === r.id);
      if (!children.length) return;
      const weighted =
        children.reduce((s, c) => s + (next.get(c.id) ?? 0) * (c.weight || 1), 0) /
        (children.reduce((s, c) => s + (c.weight || 1), 0) || 1);
      const prev = next.get(r.id) ?? 0;
      if (Math.abs(weighted - prev) > 0.0001) {
        next.set(r.id, weighted);
        changed = true;
      }
    });
  }

  const out: Record<string, { before: number; after: number; delta_pct: number }> = {};
  rows.forEach((r) => {
    const before = r.actual ?? 0;
    const after = next.get(r.id) ?? 0;
    const delta_pct = before === 0 ? 0 : ((after - before) / before) * 100;
    if (byId.has(r.id)) out[r.id] = { before, after, delta_pct };
  });
  return out;
}
