"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createApprovalRequestAction } from "@/app/(app)/governance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/types/domain";

const DEFAULT_STEPS = [
  { label: "Quản lý duyệt", approverId: "e4" },
  { label: "Kế toán kiểm tra", approverId: "e3" },
  { label: "BOD duyệt", approverId: "e1" },
];

export function ApprovalFlowBuilder({ employees }: { employees: Employee[] }) {
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const activeEmployees = employees.filter((employee) => employee.status !== "terminated");

  function updateStep(index: number, patch: Partial<(typeof steps)[number]>) {
    setSteps((current) => current.map((step, idx) => (idx === index ? { ...step, ...patch } : step)));
  }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        label: `Bước duyệt ${current.length + 1}`,
        approverId: activeEmployees[0]?.id ?? "",
      },
    ]);
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, idx) => idx !== index));
  }

  return (
    <form action={createApprovalRequestAction} className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <div className="space-y-3 rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="text-sm font-semibold text-[var(--text-strong)]">Phiếu đề xuất</div>
        <select
          name="kind"
          defaultValue="project_budget"
          className="h-11 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-strong)]"
        >
          <option value="project_budget">Đề xuất thanh toán / budget</option>
          <option value="payroll_adjustment">Điều chỉnh payroll</option>
          <option value="job_requisition">Đề xuất tuyển dụng</option>
          <option value="kpi_change">Đề xuất đổi KPI</option>
        </select>
        <Input name="title" placeholder="Tiêu đề request..." defaultValue="Phiếu đề xuất thanh toán test" />
        <select
          name="requestedBy"
          defaultValue="e5"
          className="h-11 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-strong)]"
        >
          {activeEmployees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>
        <Input name="amount" type="number" min="0" step="1000000" placeholder="Số tiền / target" defaultValue="150000000" />
        <Input name="headcount" type="number" min="1" placeholder="Headcount nếu là tuyển dụng" defaultValue="2" />
        <textarea
          name="note"
          placeholder="Lý do / chi tiết đề xuất..."
          defaultValue="Tạo request để test flow phê duyệt tự build"
          className="min-h-24 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-soft)]/75 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
        />
        <Button type="submit" className="w-full">
          Tạo request theo flow này
        </Button>
      </div>

      <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-alt)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--text-strong)]">Approval Flow Builder</div>
            <div className="text-xs text-[var(--text-soft)]">
              Tự thêm bước, đặt tên bước và chọn người duyệt giống flow thực tế.
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addStep}>
            <Plus className="h-4 w-4" />
            Thêm bước
          </Button>
        </div>

        <div className="mx-auto max-w-[420px] space-y-3">
          <div className="rounded-2xl border border-slate-300 bg-slate-200 p-3">
            <div className="text-xs font-bold text-slate-700">Submit</div>
            <div className="mt-1 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">Người tạo gửi phiếu đề xuất</div>
          </div>

          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-semibold text-[var(--brand-600)] shadow">
                +
              </div>
              <div className="rounded-2xl border-2 border-orange-500 bg-orange-50 p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Input
                    name="flowStepLabel"
                    value={step.label}
                    onChange={(event) => updateStep(index, { label: event.target.value })}
                    className="h-9 border-orange-200 bg-white text-xs font-semibold"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="rounded-xl p-2 text-orange-700 hover:bg-orange-100"
                      aria-label="Xóa bước"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <select
                  name="flowStepApproverId"
                  value={step.approverId}
                  onChange={(event) => updateStep(index, { approverId: event.target.value })}
                  className="h-11 w-full rounded-xl border border-orange-200 bg-white px-3 text-sm text-slate-700"
                >
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      Approver: {employee.full_name}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="flowStepRole" value="manual" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
