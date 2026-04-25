"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import type { KpiRow } from "@/lib/kpi/cascade";

export function KpiTreeGraph({ rows }: { rows: KpiRow[] }) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Simple layered layout: level → y, index in level → x
    const byLevel: Record<string, KpiRow[]> = {
      company: [],
      department: [],
      team: [],
      employee: [],
    };
    rows.forEach((r) => byLevel[r.level]?.push(r));

    const levelY: Record<string, number> = { company: 20, department: 180, team: 340, employee: 500 };

    Object.entries(byLevel).forEach(([lvl, arr]) => {
      const spacing = 260;
      const totalWidth = (arr.length - 1) * spacing;
      const startX = 700 - totalWidth / 2;
      arr.forEach((r, i) => {
        const color =
          r.status === "green" ? "#10b981" : r.status === "yellow" ? "#f59e0b" : r.status === "red" ? "#ef4444" : "#a1a1aa";
        nodes.push({
          id: r.id,
          position: { x: startX + i * spacing, y: levelY[lvl] },
          data: {
            label: (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{r.code}</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    color,
                    fontWeight: 600,
                  }}
                >
                  {r.completion == null ? "—" : `${Math.round(r.completion * 100)}%`}
                </div>
              </div>
            ),
          },
          style: {
            background: "white",
            border: `2px solid ${color}`,
            borderRadius: 10,
            padding: 8,
            width: 200,
          },
        });
      });
    });

    rows.forEach((r) => {
      if (r.parent_kpi_id) {
        edges.push({
          id: `e-${r.parent_kpi_id}-${r.id}`,
          source: r.parent_kpi_id,
          target: r.id,
          style: { stroke: "#d4d4d8" },
        });
      }
    });

    return { nodes, edges };
  }, [rows]);

  return (
    <div className="reactflow-wrapper" style={{ height: 620, background: "#fafafa", borderRadius: 12 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e4e4e7" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap style={{ background: "white" }} pannable />
      </ReactFlow>
    </div>
  );
}
