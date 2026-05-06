"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import type { KpiRow } from "@/lib/kpi/cascade";

type ExecutionMeta = {
  actionPlanCount: number;
  taskCount: number;
  overdueTasks: number;
  blockedTasks: number;
  executionRisk: "green" | "yellow" | "red";
};

export function KpiTreeGraph({
  rows,
  selectedId,
  onSelect,
  executionMetaByKpiId = {},
}: {
  rows: KpiRow[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  executionMetaByKpiId?: Record<string, ExecutionMeta>;
}) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const byLevel: Record<string, KpiRow[]> = {
      company: [],
      department: [],
      team: [],
      employee: [],
    };
    rows.forEach((row) => byLevel[row.level]?.push(row));

    const levelY: Record<string, number> = { company: 20, department: 210, team: 400, employee: 590 };

    Object.entries(byLevel).forEach(([level, items]) => {
      const spacing = 280;
      const totalWidth = (items.length - 1) * spacing;
      const startX = 760 - totalWidth / 2;

      items.forEach((row, index) => {
        const color =
          row.status === "green"
            ? "#10b981"
            : row.status === "yellow"
              ? "#f59e0b"
              : row.status === "red"
                ? "#ef4444"
                : "#a1a1aa";
        const meta = executionMetaByKpiId[row.id];
        const riskColor =
          meta?.executionRisk === "green"
            ? "#10b981"
            : meta?.executionRisk === "yellow"
              ? "#f59e0b"
              : "#ef4444";

        nodes.push({
          id: row.id,
          position: { x: startX + index * spacing, y: levelY[level] },
          data: {
            label: (
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#18181b", lineHeight: 1.3 }}>{row.name}</div>
                  <div
                    style={{
                      padding: "2px 6px",
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#fff",
                      background: riskColor,
                    }}
                  >
                    {meta?.executionRisk ?? row.status}
                  </div>
                </div>
                <div style={{ marginTop: 4, fontSize: 9, color: "#6b7280" }}>{row.code ?? row.level}</div>
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color }}>
                  {row.completion == null ? "—" : `${Math.round(row.completion * 100)}%`}
                </div>
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <SmallBadge label={`AP ${meta?.actionPlanCount ?? 0}`} />
                  <SmallBadge label={`Task ${meta?.taskCount ?? 0}`} />
                  <SmallBadge label={`OD ${meta?.overdueTasks ?? 0}`} tone="warning" />
                  <SmallBadge label={`BL ${meta?.blockedTasks ?? 0}`} tone="danger" />
                </div>
              </div>
            ),
          },
          style: {
            background: selectedId === row.id ? "#eef2ff" : "white",
            border: `2px solid ${selectedId === row.id ? "#4f46e5" : color}`,
            borderRadius: 14,
            padding: 10,
            width: 230,
            boxShadow: selectedId === row.id ? "0 0 0 3px rgba(99,102,241,0.16)" : "0 6px 16px rgba(15,23,42,0.06)",
            cursor: onSelect ? "pointer" : "default",
          },
        });
      });
    });

    rows.forEach((row) => {
      if (row.parent_kpi_id) {
        edges.push({
          id: `e-${row.parent_kpi_id}-${row.id}`,
          source: row.parent_kpi_id,
          target: row.id,
          style: { stroke: "#d4d4d8" },
        });
      }
    });

    return { nodes, edges };
  }, [executionMetaByKpiId, onSelect, rows, selectedId]);

  return (
    <div className="reactflow-wrapper" style={{ height: 720, background: "#fafafa", borderRadius: 12 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, node) => onSelect?.(node.id)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e4e4e7" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap style={{ background: "white" }} pannable />
      </ReactFlow>
    </div>
  );
}

function SmallBadge({ label, tone = "default" }: { label: string; tone?: "default" | "warning" | "danger" }) {
  const colors =
    tone === "danger"
      ? { background: "#fef2f2", color: "#b91c1c", border: "#fecaca" }
      : tone === "warning"
        ? { background: "#fffbeb", color: "#b45309", border: "#fde68a" }
        : { background: "#f4f4f5", color: "#52525b", border: "#e4e4e7" };

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        borderRadius: 999,
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 6px",
        textAlign: "center",
      }}
    >
      {label}
    </div>
  );
}
