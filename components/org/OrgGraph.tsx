"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import type { Department, Employee } from "@/types/domain";

export function OrgGraph({
  company,
  departments,
  employees,
}: {
  company: { name: string };
  departments: Department[];
  employees: Employee[];
}) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root: company
    nodes.push({
      id: "root",
      position: { x: 600, y: 20 },
      data: { label: company.name },
      style: {
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "white",
        border: "none",
        borderRadius: 12,
        padding: 14,
        fontWeight: 600,
        fontSize: 14,
        width: 200,
        textAlign: "center" as const,
      },
    });

    // Layer 2: departments
    const spacing = 220;
    const totalWidth = (departments.length - 1) * spacing;
    const startX = 600 - totalWidth / 2 + 100;

    departments.forEach((d, i) => {
      const x = startX + i * spacing - 100;
      nodes.push({
        id: d.id,
        position: { x, y: 160 },
        data: {
          label: (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{d.name}</div>
              <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{d.code}</div>
            </div>
          ),
        },
        style: {
          background: "white",
          border: "1px solid #e4e4e7",
          borderRadius: 10,
          padding: 10,
          width: 180,
        },
      });
      edges.push({
        id: `e-root-${d.id}`,
        source: "root",
        target: d.id,
        style: { stroke: "#a1a1aa" },
      });
    });

    // Layer 3: heads/team members for each dept
    departments.forEach((d, i) => {
      const deptEmployees = employees.filter((e) => e.department_id === d.id);
      deptEmployees.slice(0, 4).forEach((e, j) => {
        const parentX = startX + i * spacing - 100;
        nodes.push({
          id: e.id,
          position: { x: parentX - 40 + (j % 2) * 80, y: 320 + Math.floor(j / 2) * 90 },
          data: {
            label: (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 500, fontSize: 11 }}>{e.full_name}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{e.email}</div>
              </div>
            ),
          },
          style: {
            background: d.head_employee_id === e.id ? "#eef2ff" : "white",
            border: d.head_employee_id === e.id ? "1px solid #6366f1" : "1px solid #e4e4e7",
            borderRadius: 10,
            padding: 8,
            width: 150,
            fontSize: 11,
          },
        });
        edges.push({
          id: `e-${d.id}-${e.id}`,
          source: d.id,
          target: e.id,
          style: { stroke: "#d4d4d8" },
        });
      });
    });

    return { nodes, edges };
  }, [company, departments, employees]);

  return (
    <div className="reactflow-wrapper" style={{ height: 620, background: "#fafafa", borderRadius: 12 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e4e4e7" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap style={{ background: "white" }} pannable />
      </ReactFlow>
    </div>
  );
}
