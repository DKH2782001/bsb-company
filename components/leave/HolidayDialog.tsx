"use client";

import { useState, useTransition } from "react";
import { upsertHolidayAction } from "@/app/(app)/leave/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Holiday } from "@/lib/repositories/leave";

export function HolidayDialog({ trigger, initial }: { trigger: React.ReactNode; initial?: Holiday }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function onSubmit(formData: FormData) {
    setError(null);
    if (initial?.id) formData.set("id", initial.id);
    startTransition(async () => {
      const result = await upsertHolidayAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      toast({ variant: "success", title: initial ? "Đã cập nhật ngày lễ" : "Đã thêm ngày lễ" });
      setOpen(false);
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onClose={() => setOpen(false)} title={initial ? "Sửa ngày lễ" : "Thêm ngày lễ"}>
        <form action={onSubmit} className="space-y-3">
          <Field label="Tên ngày lễ *" name="name" defaultValue={initial?.name ?? ""} required />
          <Field label="Ngày *" name="holiday_date" type="date" defaultValue={initial?.holiday_date ?? ""} required />
          <Field label="Ghi chú" name="notes" defaultValue={initial?.notes ?? ""} />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_paid" defaultChecked={initial?.is_paid ?? true} className="h-4 w-4" />
              Có lương
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_substitute" defaultChecked={initial?.is_substitute ?? false} className="h-4 w-4" />
              Nghỉ bù
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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <Input name={name} type={type} defaultValue={defaultValue} required={required} />
    </label>
  );
}
