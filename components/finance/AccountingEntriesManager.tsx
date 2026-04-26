"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useToast } from "@/components/ui/toast";
import { AccountingEntryFormDialog } from "./AccountingEntryFormDialog";
import { deleteAccountingEntryAction } from "@/app/(app)/workspace/actions";
import { bulkImportAccountingEntriesAction } from "@/app/(app)/_actions/bulk-import";
import { ImportExportButtons } from "@/components/import-export/ImportExportButtons";
import type { ImportColumn } from "@/components/import-export/ImportDialog";
import { formatVND } from "@/lib/utils";
import type { AccountingEntry, Department } from "@/types/domain";

const ENTRY_IMPORT_COLUMNS: ImportColumn[] = [
  { header: "accountCode", key: "accountCode", required: true,  hint: "Mã tài khoản (vd 511, 642)", sample: "511" },
  { header: "debit",       key: "debit",                          hint: "Số tiền vế Nợ", sample: 0 },
  { header: "credit",      key: "credit",                         hint: "Số tiền vế Có", sample: 0 },
  { header: "departmentId",key: "departmentId",                   hint: "ID phòng ban", sample: "" },
  { header: "note",        key: "note",                           hint: "Ghi chú", sample: "" },
  { header: "entryDate",   key: "entryDate",   required: true,   hint: "YYYY-MM-DD", sample: "2026-04-26",
    validate: (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? null : "entryDate phải là YYYY-MM-DD") },
];

type Row = AccountingEntry & { dept_name: string };

export function AccountingEntriesManager({
  rows,
  departments,
}: {
  rows: Row[];
  departments: Department[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<AccountingEntry | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AccountingEntry | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteAccountingEntryAction(deleteTarget.id);
    if (res.ok) {
      toast({ variant: "success", title: "Đã xoá bút toán" });
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Không thể xoá", description: res.error });
    }
  };

  const columns: Column<Row>[] = [
    { key: "date", header: "Ngày", render: (r) => r.entry_date },
    { key: "code", header: "TK", render: (r) => <span className="font-mono">{r.account_code}</span> },
    { key: "debit", header: "Nợ", align: "right", render: (r) => (r.debit ? formatVND(r.debit) : "—") },
    { key: "credit", header: "Có", align: "right", render: (r) => (r.credit ? formatVND(r.credit) : "—") },
    { key: "dept", header: "Phòng ban", render: (r) => r.dept_name },
    { key: "note", header: "Ghi chú", render: (r) => r.note ?? "—" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => setEditing(r)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" title="Sửa">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setDeleteTarget(r)} className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600" title="Xoá">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 flex flex-wrap justify-between items-center gap-2">
        <ImportExportButtons
          entityLabel="bút toán"
          filenameBase="accounting_entries"
          importColumns={ENTRY_IMPORT_COLUMNS}
          onImport={bulkImportAccountingEntriesAction}
          exportRows={rows}
          exportColumns={[
            { key: "id", header: "id" },
            { key: "entry_date", header: "Ngày" },
            { key: "account_code", header: "Mã TK" },
            { key: "debit", header: "Nợ" },
            { key: "credit", header: "Có" },
            { key: "dept_name", header: "Phòng ban" },
            { key: "note", header: "Ghi chú" },
          ]}
        />
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Ghi bút toán
        </Button>
      </div>

      <DataTable columns={columns} rows={rows} empty="Chưa có bút toán nào" />

      <AccountingEntryFormDialog open={creating} onClose={() => setCreating(false)} departments={departments} onSaved={() => router.refresh()} />
      <AccountingEntryFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        entry={editing}
        departments={departments}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá bút toán?"
        description={`TK ${deleteTarget?.account_code} ngày ${deleteTarget?.entry_date}. Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá bút toán"
      />
    </>
  );
}
