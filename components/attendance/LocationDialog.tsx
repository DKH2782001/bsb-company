"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { upsertLocationAction } from "@/app/(app)/attendance/actions";
import type { AttendanceLocation } from "@/lib/repositories/attendance";

export function LocationDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: AttendanceLocation;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function onSubmit(formData: FormData) {
    setError(null);
    if (initial?.id) formData.set("id", initial.id);
    startTransition(async () => {
      const result = await upsertLocationAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      toast({ variant: "success", title: initial ? "Đã cập nhật địa điểm" : "Đã thêm địa điểm" });
      setOpen(false);
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={initial ? "Sửa địa điểm chấm công" : "Thêm địa điểm chấm công"}
      >
        <form
          action={onSubmit}
          className="space-y-3"
        >
          <Field label="Tên địa điểm *" name="name" defaultValue={initial?.name ?? ""} required />
          <Field label="Địa chỉ" name="address" defaultValue={initial?.address ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vĩ độ (lat)" name="latitude" type="number" step="0.0000001" defaultValue={initial?.latitude?.toString() ?? ""} />
            <Field label="Kinh độ (lng)" name="longitude" type="number" step="0.0000001" defaultValue={initial?.longitude?.toString() ?? ""} />
          </div>
          <Field label="Bán kính cho phép (m)" name="radius_m" type="number" defaultValue={initial?.radius_m?.toString() ?? "200"} />
          <Field
            label="IP whitelist (cách nhau bởi dấu phẩy)"
            name="ip_whitelist"
            defaultValue={initial?.ip_whitelist?.join(", ") ?? ""}
            placeholder="vd: 27.72.0.1, 14.169.0.1"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-4 w-4" />
            Đang hoạt động
          </label>

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
