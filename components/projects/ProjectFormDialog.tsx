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
  projectUpsertSchema,
  type ProjectUpsertInput,
  type ProjectUpsertOutput,
} from "@/lib/validation/schemas";
import { upsertProjectAction } from "@/app/(app)/workspace/actions";
import type { Employee, Project } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  employees: Employee[];
  onSaved?: () => void;
};

export function ProjectFormDialog({ open, onClose, project, employees, onSaved }: Props) {
  const isEdit = Boolean(project?.id);
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: ProjectUpsertInput = React.useMemo(
    () => ({
      id: project?.id,
      name: project?.name ?? "",
      code: project?.code ?? undefined,
      ownerId: project?.owner_id ?? undefined,
      budget: project?.budget ?? 0,
      startsAt: project?.starts_at ?? undefined,
      endsAt: project?.ends_at ?? undefined,
      businessCase: project?.business_case ?? undefined,
      status: (project?.status ?? "draft") as ProjectUpsertInput["status"],
    }),
    [project],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectUpsertInput, unknown, ProjectUpsertOutput>({
    resolver: zodResolver(projectUpsertSchema),
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
    const res = await upsertProjectAction(values);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [f, msgs] of Object.entries(res.fieldErrors)) {
          setError(f as keyof ProjectUpsertInput, { message: msgs[0] });
        }
      }
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật" : "Đã tạo dự án", description: res.message });
    onSaved?.();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
      description={isEdit ? project?.name : "Tạo dự án và gán owner."}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="project-form" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo dự án"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên dự án" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField label="Mã dự án" htmlFor="code" error={errors.code?.message}>
          <Input id="code" {...register("code")} placeholder="PROJ-2026-001" />
        </FormField>
        <FormField label="Owner" htmlFor="ownerId" error={errors.ownerId?.message}>
          <Controller
            control={control}
            name="ownerId"
            render={({ field }) => (
              <Select id="ownerId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Chưa gán —</option>
                {employees.map((e) => (<option key={e.id} value={e.id}>{e.full_name}</option>))}
              </Select>
            )}
          />
        </FormField>
        <FormField label="Budget (VND)" htmlFor="budget" required error={errors.budget?.message}>
          <Input id="budget" type="number" min={0} step={1000000} {...register("budget", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Bắt đầu" htmlFor="startsAt" error={errors.startsAt?.message}>
          <Input id="startsAt" type="date" {...register("startsAt")} />
        </FormField>
        <FormField label="Kết thúc" htmlFor="endsAt" error={errors.endsAt?.message}>
          <Input id="endsAt" type="date" {...register("endsAt")} />
        </FormField>
        <FormField label="Trạng thái" htmlFor="status" required error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select id="status" {...field}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Business case" htmlFor="businessCase" error={errors.businessCase?.message} className="sm:col-span-2">
          <Input id="businessCase" {...register("businessCase")} placeholder="Vì sao cần dự án này?" />
        </FormField>
        {serverError && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Dialog>
  );
}
