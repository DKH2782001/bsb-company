"use client";

import { useState, useTransition } from "react";
import { upsertLeaveTypeAction } from "@/app/(app)/leave/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { LeaveType } from "@/lib/repositories/leave";

export function LeaveTypeDialog({ trigger, initial }: { trigger: React.ReactNode; initial?: LeaveType }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function onSubmit(formData: FormData) {
    setError(null);
    if (initial?.id) formData.set("id", initial.id);
    startTransition(async () => {
      const result = await upsertLeaveTypeAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      toast({ variant: "success", title: initial ? "Đã cập nhật loại nghỉ" : "Đã thêm loại nghỉ" });
      setOpen(false);
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onClose={() => setOpen(false)} title={initial ? "Sửa loại nghỉ phép" : "Thêm loại nghỉ phép"}>
        <form action={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã *" name="code" defaultValue={initial?.code ?? ""} required placeholder="ANNUAL, SICK..." />
            <Field label="Tên *" name="name" defaultValue={initial?.name ?? ""} required />
          </div>
          <Field label="Mô tả" name="description" defaultValue={initial?.description ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quota mặc định (ngày/năm)" name="default_quota_days" type="number" step="0.5" defaultValue={initial?.default_quota_days?.toString() ?? ""} />
            <Field label="Carry-over tối đa" name="carry_over_max_days" type="number" step="0.5" defaultValue={initial?.carry_over_max_days?.toString() ?? "0"} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="paid" defaultChecked={initial?.paid ?? true} className="h-4 w-4" />
              Có lương
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requires_attachment" defaultChecked={initial?.requires_attachment ?? false} className="h-4 w-4" />
              Yêu cầu tài liệu kèm theo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-4 w-4" />
              Đang hoạt động
            </label>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  step,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  step?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <Input name={name} type={type} step={step} defaultValue={defaultValue} required={required} placeholder={placeholder} />
    </label>
  );
}
