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
  accountingEntryUpsertSchema,
  type AccountingEntryUpsertInput,
  type AccountingEntryUpsertOutput,
} from "@/lib/validation/schemas";
import { upsertAccountingEntryAction } from "@/app/(app)/workspace/actions";
import type { AccountingEntry, Department } from "@/types/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  entry?: AccountingEntry | null;
  departments: Department[];
  onSaved?: () => void;
};

export function AccountingEntryFormDialog({ open, onClose, entry, departments, onSaved }: Props) {
  const isEdit = Boolean(entry?.id);
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const defaultValues: AccountingEntryUpsertInput = React.useMemo(
    () => ({
      id: entry?.id,
      accountCode: entry?.account_code ?? "",
      debit: entry?.debit ?? 0,
      credit: entry?.credit ?? 0,
      departmentId: entry?.department_id ?? undefined,
      note: entry?.note ?? undefined,
      entryDate: entry?.entry_date ?? new Date().toISOString().slice(0, 10),
    }),
    [entry],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AccountingEntryUpsertInput, unknown, AccountingEntryUpsertOutput>({
    resolver: zodResolver(accountingEntryUpsertSchema),
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
    const res = await upsertAccountingEntryAction(values);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [f, msgs] of Object.entries(res.fieldErrors)) {
          setError(f as keyof AccountingEntryUpsertInput, { message: msgs[0] });
        }
      }
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật bút toán" : "Đã ghi bút toán", description: res.message });
    onSaved?.();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Chỉnh sửa bút toán" : "Ghi bút toán mới"}
      description="Account code theo TK kế toán VN (511, 632, 641, 642, ...)"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="ae-form" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Ghi bút toán"}
          </Button>
        </>
      }
    >
      <form id="ae-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Account code" htmlFor="accountCode" required error={errors.accountCode?.message}>
          <Input id="accountCode" {...register("accountCode")} placeholder="511" />
        </FormField>
        <FormField label="Ngày bút toán" htmlFor="entryDate" required error={errors.entryDate?.message}>
          <Input id="entryDate" type="date" {...register("entryDate")} />
        </FormField>
        <FormField label="Debit (Nợ)" htmlFor="debit" error={errors.debit?.message}>
          <Input id="debit" type="number" min={0} step={1000} {...register("debit", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Credit (Có)" htmlFor="credit" error={errors.credit?.message}>
          <Input id="credit" type="number" min={0} step={1000} {...register("credit", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Phòng ban" htmlFor="departmentId" error={errors.departmentId?.message}>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select id="departmentId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}>
                <option value="">— Không gán —</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </Select>
            )}
          />
        </FormField>
        <FormField label="Ghi chú" htmlFor="note" error={errors.note?.message}>
          <Input id="note" {...register("note")} />
        </FormField>
        {serverError && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Dialog>
  );
}
