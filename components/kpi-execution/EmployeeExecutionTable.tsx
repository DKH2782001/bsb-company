"use client";

import { useState } from "react";
import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonalKpiExecutionRow, PersonalKpiRisk } from "@/lib/kpi/personalExecution";

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function riskBadge(risk: PersonalKpiRisk) {
  if (risk === "high") return <Badge variant="danger">High</Badge>;
  if (risk === "medium") return <Badge variant="warning">Medium</Badge>;
  return <Badge variant="success">Low</Badge>;
}

function personalKpiBadge(value: number) {
  if (value >= 90) return <Badge variant="success">Tốt</Badge>;
  if (value >= 70) return <Badge variant="warning">Trung bình</Badge>;
  return <Badge variant="danger">Cần chú ý</Badge>;
}

export function EmployeeExecutionTable({ rows }: { rows: PersonalKpiExecutionRow[] }) {
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Personal KPI Execution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-900">
          KPI cá nhân = SUM(task weight × completion %) / SUM(task weight). Task có thể thuộc nhiều KPI và Action Plan khác nhau.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr className="border-b border-zinc-200">
                <th className="px-3 py-3 font-semibold">Employee</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold text-right">KPI Count</th>
                <th className="px-3 py-3 font-semibold text-right">Action Plan Count</th>
                <th className="px-3 py-3 font-semibold text-right">Total Tasks</th>
                <th className="px-3 py-3 font-semibold text-right">Done</th>
                <th className="px-3 py-3 font-semibold text-right">Overdue</th>
                <th className="px-3 py-3 font-semibold text-right">Blocked</th>
                <th className="px-3 py-3 font-semibold text-right">Total Weight</th>
                <th className="px-3 py-3 font-semibold text-right">Weighted Score</th>
                <th className="px-3 py-3 font-semibold text-right">Personal KPI %</th>
                <th className="px-3 py-3 font-semibold text-right">Quality Avg</th>
                <th className="px-3 py-3 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expanded = expandedEmployeeId === row.employeeId;
                return (
                  <Fragment key={row.employeeId}>
                    <tr
                      className="cursor-pointer border-b border-zinc-100 align-top transition-colors hover:bg-indigo-50/50"
                      onClick={() => setExpandedEmployeeId(expanded ? null : row.employeeId)}
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-zinc-900">{row.employeeName}</div>
                        <div className="text-xs text-zinc-500">Click để xem task chi tiết</div>
                      </td>
                      <td className="px-3 py-3 text-zinc-700">{row.role}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.kpiCount}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.actionPlanCount}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.totalTasks}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.doneTasks}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.overdueTasks}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.blockedTasks}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{formatNumber(row.totalWeight)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{formatNumber(row.weightedScore)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <span className="font-semibold tabular-nums text-zinc-900">{formatPercent(row.personalKpiPercent)}</span>
                          {personalKpiBadge(row.personalKpiPercent)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                        {row.qualityAvg == null ? "N/A" : formatPercent(row.qualityAvg)}
                      </td>
                      <td className="px-3 py-3">{riskBadge(row.risk)}</td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-zinc-100 bg-zinc-50/80">
                        <td colSpan={13} className="px-3 py-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Task detail của {row.employeeName}
                          </div>
                          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
                            <table className="min-w-full text-xs">
                              <thead className="bg-zinc-50 text-left uppercase tracking-wide text-zinc-500">
                                <tr>
                                  <th className="px-3 py-2 font-semibold">Task Name</th>
                                  <th className="px-3 py-2 font-semibold">KPI</th>
                                  <th className="px-3 py-2 font-semibold">Action Plan</th>
                                  <th className="px-3 py-2 text-right font-semibold">Mục tiêu cần đạt</th>
                                  <th className="px-3 py-2 text-right font-semibold">Kết quả thực tế</th>
                                  <th className="px-3 py-2 text-right font-semibold">% hoàn thành</th>
                                  <th className="px-3 py-2 text-right font-semibold">Trọng số công việc</th>
                                  <th className="px-3 py-2 text-right font-semibold">Điểm quy đổi</th>
                                  <th className="px-3 py-2 font-semibold">Status</th>
                                  <th className="px-3 py-2 font-semibold">Due Date</th>
                                  <th className="px-3 py-2 font-semibold">Lead/Owner</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.taskDetails.map((task) => (
                                  <tr key={task.taskId} className="border-t border-zinc-100">
                                    <td className="px-3 py-2 font-medium text-zinc-900">{task.taskName}</td>
                                    <td className="px-3 py-2 text-zinc-700">{task.kpiName}</td>
                                    <td className="px-3 py-2 text-zinc-700">{task.actionPlanName}</td>
                                    <td className="px-3 py-2 text-right tabular-nums text-zinc-700">{formatNumber(task.actionTargetValue)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums text-zinc-700">{formatNumber(task.actionActualValue)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums text-zinc-700">{formatPercent(task.completionPercent)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums text-zinc-700">{formatNumber(task.weight)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums font-medium text-zinc-900">{formatNumber(task.weightedScore)}</td>
                                    <td className="px-3 py-2 text-zinc-700">{task.status}</td>
                                    <td className="px-3 py-2 text-zinc-700">{task.dueDate ?? "N/A"}</td>
                                    <td className="px-3 py-2 text-zinc-700">{task.leadName}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-sm text-zinc-500">
                    Chưa có dữ liệu KPI cá nhân theo nhân sự trong tháng này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
