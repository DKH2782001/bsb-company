"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { upsertShiftAction } from "@/app/(app)/attendance/actions";
import type { AttendanceShift } from "@/lib/repositories/attendance";

export function ShiftDialog({ trigger, initial }: { trigger: React.ReactNode; initial?: AttendanceShift }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function onSubmit(formData: FormData) {
    setError(null);
    if (initial?.id) formData.set("id", initial.id);
    startTransition(async () => {
      const result = await upsertShiftAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      toast({ variant: "success", title: initial ? "Đã cập nhật ca làm" : "Đã thêm ca làm" });
      setOpen(false);
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onClose={() => setOpen(false)} title={initial ? "Sửa ca làm" : "Thêm ca làm"}>
        <form action={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã ca *" name="code" defaultValue={initial?.code ?? ""} required placeholder="DAY, NIGHT..." />
            <Field label="Tên ca *" name="name" defaultValue={initial?.name ?? ""} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giờ bắt đầu" name="start_time" type="time" defaultValue={initial?.start_time ?? "08:30"} />
            <Field label="Giờ kết thúc" name="end_time" type="time" defaultValue={initial?.end_time ?? "17:30"} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Nghỉ trưa (phút)" name="break_minutes" type="number" defaultValue={initial?.break_minutes?.toString() ?? "60"} />
            <Field label="Bỏ qua trễ (phút)" name="late_grace_minutes" type="number" defaultValue={initial?.late_grace_minutes?.toString() ?? "5"} />
            <Field label="Bỏ qua sớm (phút)" name="early_leave_grace_minutes" type="number" defaultValue={initial?.early_leave_grace_minutes?.toString() ?? "5"} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_overnight" defaultChecked={initial?.is_overnight ?? false} className="h-4 w-4" />
              Ca qua đêm
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
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <Input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} />
    </label>
  );
}
