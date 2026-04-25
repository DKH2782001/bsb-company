"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useToast } from "@/components/ui/toast";
import { KpiStatusBadge } from "@/components/kpi/KpiStatusBadge";
import { DepartmentFormDialog } from "./DepartmentFormDialog";
import { deleteDepartmentAction } from "@/app/(app)/workspace/actions";
import { formatCompactVND } from "@/lib/utils";
import type { Department, Employee } from "@/types/domain";

type Row = Department & {
  head_name: string;
  headcount: number;
  kpi_status: "green" | "yellow" | "red" | "na";
  kpi_completion: number | null;
};

export function DepartmentsManager({
  rows,
  employees,
  departments,
}: {
  rows: Row[];
  employees: Employee[];
  departments: Department[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Department | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteDepartmentAction(deleteTarget.id);
    if (res.ok) {
      toast({ variant: "success", title: "Đã xoá phòng ban", description: deleteTarget.name });
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Không thể xoá", description: res.error });
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Phòng ban",
      render: (d) => (
        <Link href={`/departments/${d.id}`} className="font-medium text-zinc-900 hover:text-indigo-700">
          {d.name}
          <div className="text-xs text-zinc-500">{d.code}</div>
        </Link>
      ),
    },
    { key: "head", header: "Head", render: (d) => d.head_name },
    { key: "headcount", header: "Nhân sự", align: "right", render: (d) => String(d.headcount) },
    {
      key: "budget",
      header: "Budget/tháng",
      align: "right",
      render: (d) => formatCompactVND(d.budget_monthly),
    },
    {
      key: "kpi",
      header: "KPI completion",
      align: "right",
      render: (d) => <KpiStatusBadge status={d.kpi_status} completion={d.kpi_completion} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/departments/${d.id}`}
            className="rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
          >
            Xem
          </Link>
          <button
            type="button"
            onClick={() => setEditing(d)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label={`Sửa ${d.name}`}
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(d)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
            aria-label={`Xoá ${d.name}`}
            title="Xoá"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Tạo phòng ban
        </Button>
      </div>

      <DataTable columns={columns} rows={rows} />

      <DepartmentFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        employees={employees}
        onSaved={() => router.refresh()}
      />

      <DepartmentFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        department={editing}
        employees={employees}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xoá phòng ban ${deleteTarget?.name ?? ""}?`}
        description="Phòng ban sẽ bị xoá vĩnh viễn. Yêu cầu phải không còn nhân sự thuộc phòng ban này. KPI thuộc phòng ban sẽ trở thành unassigned."
        confirmLabel="Xoá phòng ban"
      />
    </>
  );
}
