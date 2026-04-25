"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, Select } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import {
  sopUpsertSchema,
  type SopUpsertInput,
  type SopUpsertOutput,
} from "@/lib/validation/schemas";
import { upsertSopAction } from "@/app/(app)/workspace/actions";
import type { Department, SopDocument } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  sop?: SopDocument | null;
  departments: Department[];
  onSaved?: () => void;
};

export function SopFormDialog({ open, onClose, sop, departments, onSaved }: Props) {
  const isEdit = Boolean(sop?.id);
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: SopUpsertInput = React.useMemo(
    () => ({
      id: sop?.id,
      title: sop?.title ?? "",
      departmentId: sop?.department_id ?? undefined,
      body: sop?.body ?? undefined,
      published: sop?.published ?? false,
    }),
    [sop],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SopUpsertInput, unknown, SopUpsertOutput>({
    resolver: zodResolver(sopUpsertSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
      setServerError(null);
    }
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await upsertSopAction(values);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [f, msgs] of Object.entries(res.fieldErrors)) {
          setError(f as keyof SopUpsertInput, { message: msgs[0] });
        }
      }
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật SOP" : "Đã tạo SOP", description: res.message });
    onSaved?.();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? `Chỉnh sửa SOP (v${sop?.version})` : "Tạo SOP mới"}
      description={isEdit ? "Sửa sẽ tự động bump version." : "Standard Operating Procedure cho phòng ban."}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="sop-form" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu phiên bản mới" : "Tạo SOP"}
          </Button>
        </>
      }
    >
      <form id="sop-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên SOP" htmlFor="title" required error={errors.title?.message} className="sm:col-span-2">
          <Input id="title" {...register("title")} placeholder="Quy trình close đơn B2B" />
        </FormField>
        <FormField label="Phòng ban" htmlFor="departmentId" error={errors.departmentId?.message}>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select id="departmentId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Chưa gán —</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            )}
          />
        </FormField>
        <FormField label="Trạng thái" htmlFor="published" error={errors.published?.message}>
          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <Select
                id="published"
                value={field.value ? "1" : "0"}
                onChange={(e) => field.onChange(e.target.value === "1")}
              >
                <option value="0">Draft</option>
                <option value="1">Published</option>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Nội dung" htmlFor="body" error={errors.body?.message} className="sm:col-span-2">
          <textarea
            id="body"
            {...register("body")}
            rows={6}
            className="w-full rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 py-2 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            placeholder="Mô tả chi tiết các bước, ai chịu trách nhiệm, output mong đợi..."
          />
        </FormField>
        {serverError && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Dialog>
  );
}
