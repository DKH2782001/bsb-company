"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { upsertShiftTemplateAction, deleteShiftTemplateAction } from "@/app/(app)/scheduling/actions";
import type { ShiftTemplate } from "@/lib/repositories/scheduling";

const COLORS = ["#6D5EF7", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#1E2458", "#F97316", "#8B5CF6"];

function LabeledInput({ label, name, type = "text", defaultValue = "", placeholder = "", required = false }: {
  label: string; name: string; type?: string; defaultValue?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--text-strong)]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-400)]"
      />
    </div>
  );
}

type Props = {
  template?: ShiftTemplate;
  mode: "create" | "edit";
  onSuccess?: () => void;
};

export function ShiftTemplateDialog({ template, mode, onSuccess }: Props) {
  const [open, setOpen]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTrans] = useTransition();
  const formRef                 = useRef<HTMLFormElement>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [delPending, startDel]        = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(formRef.current!);
    startTrans(async () => {
      const res = await upsertShiftTemplateAction(fd);
      if (res.ok) {
        setOpen(false);
        onSuccess?.();
      } else {
        setError(res.error);
      }
    });
  }

  function handleDelete() {
    if (!template) return;
    startDel(async () => {
      await deleteShiftTemplateAction(template.id);
      setConfirmOpen(false);
      setOpen(false);
      onSuccess?.();
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant={mode === "create" ? "default" : "ghost"}
        onClick={() => { setOpen(true); setError(null); }}
      >
        {mode === "create" ? <><Plus className="h-4 w-4 mr-1" />Thêm ca</> : <Pencil className="h-4 w-4" />}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "Thêm ca làm việc" : "Chỉnh sửa ca"}
        size="md"
        footer={
          <div className="flex items-center gap-2 w-full">
            {mode === "edit" && template && (
              <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 mr-auto" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" />Xóa
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" form="shift-template-form" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        }
      >
        <form id="shift-template-form" ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-2">
          {template?.id && <input type="hidden" name="id" value={template.id} />}

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Mã ca" name="code" defaultValue={template?.code ?? ""} placeholder="MORNING" required />
            <LabeledInput label="Tên ca" name="name" defaultValue={template?.name ?? ""} placeholder="Ca Sáng" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Giờ bắt đầu" name="start_time" type="time" defaultValue={template?.start_time ?? "08:00"} required />
            <LabeledInput label="Giờ kết thúc" name="end_time"   type="time" defaultValue={template?.end_time   ?? "17:00"} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LabeledInput label="Nghỉ giữa ca (phút)" name="break_minutes" type="number" defaultValue={String(template?.break_minutes ?? 0)} />
            <LabeledInput label="Tối thiểu (người)"   name="min_staff"     type="number" defaultValue={String(template?.min_staff ?? 1)} />
            <LabeledInput label="Tối đa (người)"       name="max_staff"     type="number" defaultValue={template?.max_staff != null ? String(template.max_staff) : ""} placeholder="—" />
          </div>
          <LabeledInput label="Vai trò yêu cầu" name="role_required" defaultValue={template?.role_required ?? ""} placeholder="thu ngân, pha chế, ..." />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Màu sắc</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <label key={c} className="relative cursor-pointer">
                  <input type="radio" name="color" value={c} defaultChecked={template?.color === c || (!template && c === "#6D5EF7")} className="sr-only peer" />
                  <span
                    className="block h-7 w-7 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-[var(--brand-600)] transition-all"
                    style={{ backgroundColor: c }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_overnight" name="is_overnight" value="true" defaultChecked={template?.is_overnight ?? false} className="rounded" />
            <label htmlFor="is_overnight" className="text-sm">Ca qua đêm (kết thúc ngày hôm sau)</label>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </form>
      </Dialog>

      {template && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Xóa ca làm việc?"
          description={`Ca "${template.name}" sẽ bị ẩn. Lịch đã xếp không bị ảnh hưởng.`}
          confirmLabel="Xóa"
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
