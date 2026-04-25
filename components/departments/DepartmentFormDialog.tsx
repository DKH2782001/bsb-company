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
  departmentUpsertSchema,
  type DepartmentUpsertInput,
  type DepartmentUpsertOutput,
} from "@/lib/validation/schemas";
import { upsertDepartmentAction } from "@/app/(app)/workspace/actions";
import type { Department, Employee } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
  employees: Employee[];
  onSaved?: () => void;
};

export function DepartmentFormDialog({ open, onClose, department, employees, onSaved }: Props) {
  const isEdit = Boolean(department?.id);
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: DepartmentUpsertInput = React.useMemo(
    () => ({
      id: department?.id,
      name: department?.name ?? "",
      code: department?.code ?? undefined,
      scope: department?.scope ?? undefined,
      budgetMonthly: department?.budget_monthly ?? 0,
      headEmployeeId: department?.head_employee_id ?? undefined,
    }),
    [department],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentUpsertInput, unknown, DepartmentUpsertOutput>({
    resolver: zodResolver(departmentUpsertSchema),
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
    const res = await upsertDepartmentAction(values);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [field, msgs] of Object.entries(res.fieldErrors)) {
          setError(field as keyof DepartmentUpsertInput, { message: msgs[0] });
        }
      }
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật" : "Đã tạo phòng ban", description: res.message });
    onSaved?.();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Chỉnh sửa phòng ban" : "Tạo phòng ban mới"}
      description={isEdit ? department?.name : "Phòng ban là đơn vị tổ chức cơ bản"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button type="submit" form="department-form" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo phòng ban"}
          </Button>
        </>
      }
    >
      <form id="department-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên phòng ban" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register("name")} placeholder="Sales" />
        </FormField>
        <FormField label="Mã" htmlFor="code" error={errors.code?.message}>
          <Input id="code" {...register("code")} placeholder="SAL" />
        </FormField>
        <FormField
          label="Phạm vi trách nhiệm"
          htmlFor="scope"
          error={errors.scope?.message}
          className="sm:col-span-2"
        >
          <Input id="scope" {...register("scope")} placeholder="Chốt đơn, mở rộng khách hàng" />
        </FormField>
        <FormField label="Budget tháng (VND)" htmlFor="budgetMonthly" required error={errors.budgetMonthly?.message}>
          <Input
            id="budgetMonthly"
            type="number"
            min={0}
            step={1000000}
            {...register("budgetMonthly", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Trưởng phòng" htmlFor="headEmployeeId" error={errors.headEmployeeId?.message}>
          <Controller
            control={control}
            name="headEmployeeId"
            render={({ field }) => (
              <Select id="headEmployeeId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Chưa gán —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </Select>
            )}
          />
        </FormField>
        {serverError && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}
      </form>
    </Dialog>
  );
}
