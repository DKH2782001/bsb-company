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
  requisitionUpsertSchema,
  type RequisitionUpsertInput,
  type RequisitionUpsertOutput,
} from "@/lib/validation/schemas";
import { upsertRequisitionAction } from "@/app/(app)/workspace/actions";
import type { Department, JobRequisition } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  requisition?: JobRequisition | null;
  departments: Department[];
  onSaved?: () => void;
};

export function RequisitionFormDialog({ open, onClose, requisition, departments, onSaved }: Props) {
  const isEdit = Boolean(requisition?.id);
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: RequisitionUpsertInput = React.useMemo(
    () => ({
      id: requisition?.id,
      title: requisition?.title ?? "",
      departmentId: requisition?.department_id ?? undefined,
      headcount: requisition?.headcount ?? 1,
      reason: requisition?.reason ?? undefined,
      status: ((requisition?.status as RequisitionUpsertInput["status"]) ?? "open"),
    }),
    [requisition],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequisitionUpsertInput, unknown, RequisitionUpsertOutput>({
    resolver: zodResolver(requisitionUpsertSchema),
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
    const res = await upsertRequisitionAction(values);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [f, msgs] of Object.entries(res.fieldErrors)) {
          setError(f as keyof RequisitionUpsertInput, { message: msgs[0] });
        }
      }
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật" : "Đã mở requisition", description: res.message });
    onSaved?.();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Chỉnh sửa requisition" : "Mở requisition mới"}
      description={isEdit ? requisition?.title : "Mở vị trí tuyển dụng."}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="req-form" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo requisition"}
          </Button>
        </>
      }
    >
      <form id="req-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Vị trí tuyển" htmlFor="title" required error={errors.title?.message} className="sm:col-span-2">
          <Input id="title" {...register("title")} placeholder="Senior Performance Marketer" />
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
        <FormField label="Số lượng (headcount)" htmlFor="headcount" required error={errors.headcount?.message}>
          <Input id="headcount" type="number" min={1} {...register("headcount", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Trạng thái" htmlFor="status" required error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select id="status" {...field}>
                <option value="open">Open</option>
                <option value="pipeline">Pipeline</option>
                <option value="filled">Filled</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Lý do tuyển" htmlFor="reason" error={errors.reason?.message} className="sm:col-span-2">
          <Input id="reason" {...register("reason")} placeholder="Mở rộng team, thay thế nhân sự nghỉ..." />
        </FormField>
        {serverError && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Dialog>
  );
}
