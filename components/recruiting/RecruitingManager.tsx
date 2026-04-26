"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useToast } from "@/components/ui/toast";
import { RequisitionFormDialog } from "./RequisitionFormDialog";
import { deleteRequisitionAction } from "@/app/(app)/workspace/actions";
import { bulkImportRequisitionsAction } from "@/app/(app)/_actions/bulk-import";
import { ImportExportButtons } from "@/components/import-export/ImportExportButtons";
import type { ImportColumn } from "@/components/import-export/ImportDialog";
import type { Department, JobRequisition } from "@/types/domain";

const REQ_IMPORT_COLUMNS: ImportColumn[] = [
  { header: "title",        key: "title",        required: true, hint: "Tên vị trí cần tuyển", sample: "Senior Sales" },
  { header: "departmentId", key: "departmentId",                  hint: "ID phòng ban", sample: "" },
  { header: "headcount",    key: "headcount",    required: true, hint: "Số lượng tuyển", sample: 2,
    validate: (v) => (Number(v) >= 1 ? null : "headcount phải >= 1") },
  { header: "reason",       key: "reason",                        hint: "Lý do tuyển", sample: "Mở rộng team" },
];

type Row = JobRequisition & { dept_name: string };

export function RecruitingManager({ rows, departments }: { rows: Row[]; departments: Department[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<JobRequisition | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<JobRequisition | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteRequisitionAction(deleteTarget.id);
    if (res.ok) {
      toast({ variant: "success", title: "Đã huỷ requisition", description: deleteTarget.title });
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Không thể huỷ", description: res.error });
    }
  };

  const columns: Column<Row>[] = [
    { key: "title", header: "Vị trí", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "dept", header: "Phòng ban", render: (r) => r.dept_name },
    { key: "headcount", header: "Số lượng", align: "center", render: (r) => String(r.headcount) },
    { key: "opened", header: "Mở", render: (r) => r.opened_at ?? "—" },
    {
      key: "status",
      header: "Trạng thái",
      align: "right",
      render: (r) => (
        <Badge variant={r.status === "open" ? "info" : r.status === "pipeline" ? "warning" : "outline"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => setEditing(r)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" title="Sửa">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            disabled={r.status === "cancelled"}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
            title={r.status === "cancelled" ? "Đã cancel" : "Huỷ requisition"}
          >
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
          entityLabel="requisition"
          filenameBase="requisitions"
          importColumns={REQ_IMPORT_COLUMNS}
          onImport={bulkImportRequisitionsAction}
          exportRows={rows}
          exportColumns={[
            { key: "id", header: "id" },
            { key: "title", header: "Vị trí" },
            { key: "department_id", header: "ID phòng ban" },
            { key: "headcount", header: "Headcount" },
            { key: "reason", header: "Lý do" },
            { key: "status", header: "Trạng thái" },
            { key: "opened_at", header: "Mở từ" },
          ]}
        />
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Mở requisition
        </Button>
      </div>

      <DataTable columns={columns} rows={rows} />

      <RequisitionFormDialog open={creating} onClose={() => setCreating(false)} departments={departments} onSaved={() => router.refresh()} />
      <RequisitionFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        requisition={editing}
        departments={departments}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Huỷ requisition ${deleteTarget?.title ?? ""}?`}
        description="Requisition sẽ chuyển sang cancelled và đóng (closed_at = now)."
        confirmLabel="Huỷ requisition"
      />
    </>
  );
}
