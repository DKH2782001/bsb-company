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
  kpiUpsertSchema,
  type KpiUpsertInput,
  type KpiUpsertOutput,
} from "@/lib/validation/schemas";
import { upsertKpiAction } from "@/app/(app)/workspace/actions";
import type { Department, Employee, Kpi } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  kpi?: Kpi | null;
  kpis: Kpi[];
  departments: Department[];
  employees: Employee[];
  onSaved?: () => void;
};

export function KpiFormDialog({ open, onClose, kpi, kpis, departments, employees, onSaved }: Props) {
  const isEdit = Boolean(kpi?.id);
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: KpiUpsertInput = React.useMemo(
    () => ({
      id: kpi?.id,
      name: kpi?.name ?? "",
      code: kpi?.code ?? undefined,
      level: (kpi?.level ?? "department") as KpiUpsertInput["level"],
      unit: kpi?.unit ?? "%",
      targetFrequency: (kpi?.target_frequency ?? "monthly") as KpiUpsertInput["targetFrequency"],
      parentKpiId: kpi?.parent_kpi_id ?? undefined,
      ownerDepartmentId: kpi?.owner_department_id ?? undefined,
      ownerEmployeeId: kpi?.owner_employee_id ?? undefined,
      weight: kpi?.weight ?? 1,
      active: kpi?.active ?? true,
      targetValue: undefined,
      period: "2026-04",
    }),
    [kpi],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<KpiUpsertInput, unknown, KpiUpsertOutput>({
    resolver: zodResolver(kpiUpsertSchema),
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
    const res = await upsertKpiAction(values);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [f, msgs] of Object.entries(res.fieldErrors)) {
          setError(f as keyof KpiUpsertInput, { message: msgs[0] });
        }
      }
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật KPI" : "Đã tạo KPI", description: res.message });
    onSaved?.();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Chỉnh sửa KPI" : "Tạo KPI mới"}
      description={isEdit ? kpi?.name : "Định nghĩa KPI và gán owner."}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="kpi-form" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo KPI"}
          </Button>
        </>
      }
    >
      <form id="kpi-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên KPI" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField label="Mã" htmlFor="code" error={errors.code?.message}>
          <Input id="code" {...register("code")} placeholder="MKT.LEADS" />
        </FormField>
        <FormField label="Cấp" htmlFor="level" required error={errors.level?.message}>
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Select id="level" {...field}>
                <option value="company">Company</option>
                <option value="department">Department</option>
                <option value="team">Team</option>
                <option value="employee">Employee</option>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Đơn vị" htmlFor="unit" required error={errors.unit?.message}>
          <Input id="unit" {...register("unit")} placeholder="%, VND, lượt..." />
        </FormField>
        <FormField label="Tần suất" htmlFor="targetFrequency" required error={errors.targetFrequency?.message}>
          <Controller
            control={control}
            name="targetFrequency"
            render={({ field }) => (
              <Select id="targetFrequency" {...field}>
                <option value="daily">Hằng ngày</option>
                <option value="weekly">Hằng tuần</option>
                <option value="monthly">Hằng tháng</option>
                <option value="quarterly">Hằng quý</option>
                <option value="yearly">Hằng năm</option>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Trọng số" htmlFor="weight" required error={errors.weight?.message}>
          <Input id="weight" type="number" step={0.05} min={0} {...register("weight", { valueAsNumber: true })} />
        </FormField>
        <FormField label="KPI cha" htmlFor="parentKpiId" error={errors.parentKpiId?.message}>
          <Controller
            control={control}
            name="parentKpiId"
            render={({ field }) => (
              <Select id="parentKpiId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Không có —</option>
                {kpis.filter((k) => k.id !== kpi?.id).map((k) => (
                  <option key={k.id} value={k.id}>{k.code ?? k.name}</option>
                ))}
              </Select>
            )}
          />
        </FormField>
        <FormField label="Owner phòng ban" htmlFor="ownerDepartmentId" error={errors.ownerDepartmentId?.message}>
          <Controller
            control={control}
            name="ownerDepartmentId"
            render={({ field }) => (
              <Select id="ownerDepartmentId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Không gán —</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            )}
          />
        </FormField>
        <FormField label="Owner cá nhân" htmlFor="ownerEmployeeId" error={errors.ownerEmployeeId?.message}>
          <Controller
            control={control}
            name="ownerEmployeeId"
            render={({ field }) => (
              <Select id="ownerEmployeeId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Không gán —</option>
                {employees.map((e) => (<option key={e.id} value={e.id}>{e.full_name}</option>))}
              </Select>
            )}
          />
        </FormField>
        {isEdit ? (
          <FormField label="Trạng thái" htmlFor="active" error={errors.active?.message}>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Select id="active" value={field.value ? "1" : "0"} onChange={(e) => field.onChange(e.target.value === "1")}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Select>
              )}
            />
          </FormField>
        ) : (
          <>
            <FormField label="Target kỳ hiện tại" htmlFor="targetValue" error={errors.targetValue?.message}>
              <Input id="targetValue" type="number" {...register("targetValue", { valueAsNumber: true, setValueAs: (v) => (Number.isFinite(v) ? v : undefined) })} />
            </FormField>
            <FormField label="Kỳ" htmlFor="period" error={errors.period?.message}>
              <Input id="period" {...register("period")} placeholder="2026-04" />
            </FormField>
          </>
        )}
        {serverError && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Dialog>
  );
}
