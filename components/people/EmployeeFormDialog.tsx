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
  employeeUpsertSchema,
  type EmployeeUpsertInput,
  type EmployeeUpsertOutput,
} from "@/lib/validation/schemas";
import { upsertEmployeeAction } from "@/app/(app)/workspace/actions";
import type { Department, Employee } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  departments: Department[];
  managers: Employee[];
  onSaved?: () => void;
};

export function EmployeeFormDialog({ open, onClose, employee, departments, managers, onSaved }: Props) {
  const isEdit = Boolean(employee?.id);
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: EmployeeUpsertInput = React.useMemo(
    () => ({
      id: employee?.id,
      fullName: employee?.full_name ?? "",
      email: employee?.email ?? "",
      departmentId: employee?.department_id ?? undefined,
      managerId: employee?.manager_id ?? undefined,
      baseSalary: employee?.base_salary ?? 0,
      employmentType: (employee?.employment_type ?? "fulltime") as EmployeeUpsertInput["employmentType"],
      status: (employee?.status ?? "active") as EmployeeUpsertInput["status"],
    }),
    [employee],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeUpsertInput, unknown, EmployeeUpsertOutput>({
    resolver: zodResolver(employeeUpsertSchema),
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
    const res = await upsertEmployeeAction(values);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [field, msgs] of Object.entries(res.fieldErrors)) {
          setError(field as keyof EmployeeUpsertInput, { message: msgs[0] });
        }
      }
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật" : "Đã tạo nhân sự", description: res.message });
    onSaved?.();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Chỉnh sửa nhân sự" : "Thêm nhân sự mới"}
      description={isEdit ? employee?.full_name : "Tạo bản ghi nhân sự cho công ty"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button type="submit" form="employee-form" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo nhân sự"}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Họ tên" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input id="fullName" {...register("fullName")} placeholder="Nguyễn Văn A" />
        </FormField>
        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} placeholder="user@company.vn" />
        </FormField>
        <FormField label="Phòng ban" htmlFor="departmentId" error={errors.departmentId?.message}>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select id="departmentId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Chưa gán —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            )}
          />
        </FormField>
        <FormField label="Manager" htmlFor="managerId" error={errors.managerId?.message}>
          <Controller
            control={control}
            name="managerId"
            render={({ field }) => (
              <Select id="managerId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Không —</option>
                {managers.filter((m) => m.id !== employee?.id).map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </Select>
            )}
          />
        </FormField>
        <FormField label="Lương cơ bản (VND)" htmlFor="baseSalary" required error={errors.baseSalary?.message}>
          <Input
            id="baseSalary"
            type="number"
            min={0}
            step={100000}
            {...register("baseSalary", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Loại hợp đồng" htmlFor="employmentType" error={errors.employmentType?.message}>
          <Controller
            control={control}
            name="employmentType"
            render={({ field }) => (
              <Select id="employmentType" {...field}>
                <option value="fulltime">Fulltime</option>
                <option value="parttime">Parttime</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="freelance">Freelance</option>
              </Select>
            )}
          />
        </FormField>
        {isEdit && (
          <FormField label="Trạng thái" htmlFor="status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select id="status" {...field}>
                  <option value="active">Đang làm việc</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="on_leave">Nghỉ phép dài</option>
                  <option value="terminated">Đã nghỉ việc</option>
                </Select>
              )}
            />
          </FormField>
        )}
        {serverError && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}
      </form>
    </Dialog>
  );
}
