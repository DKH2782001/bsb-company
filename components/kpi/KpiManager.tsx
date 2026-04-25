"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useToast } from "@/components/ui/toast";
import { KpiStatusBadge } from "@/components/kpi/KpiStatusBadge";
import { KpiFormDialog } from "./KpiFormDialog";
import { deleteKpiAction } from "@/app/(app)/workspace/actions";
import type { Department, Employee, Kpi } from "@/types/domain";

type Row = Kpi & {
  status: "green" | "yellow" | "red" | "na";
  completion: number | null;
  target: number | null;
  actual: number | null;
};

export function KpiManager({
  rows,
  kpis,
  departments,
  employees,
}: {
  rows: Row[];
  kpis: Kpi[];
  departments: Department[];
  employees: Employee[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Kpi | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Kpi | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteKpiAction(deleteTarget.id);
    if (res.ok) {
      toast({ variant: "success", title: "Đã chuyển KPI sang inactive", description: deleteTarget.name });
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Không thể xoá", description: res.error });
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "KPI",
      render: (r) => (
        <Link href={`/kpi/${r.id}`} className="font-medium hover:text-indigo-700">
          {r.name}
          <div className="text-xs text-zinc-500 font-mono">{r.code}</div>
        </Link>
      ),
    },
    { key: "level", header: "Cấp", render: (r) => <Badge variant="outline">{r.level}</Badge> },
    { key: "unit", header: "Đơn vị", render: (r) => r.unit },
    { key: "weight", header: "Trọng số", align: "right", render: (r) => r.weight.toFixed(2) },
    { key: "target", header: "Target", align: "right", render: (r) => r.target?.toLocaleString("vi-VN") ?? "—" },
    { key: "actual", header: "Thực tế", align: "right", render: (r) => r.actual?.toLocaleString("vi-VN") ?? "—" },
    {
      key: "status",
      header: "Trạng thái",
      align: "right",
      render: (r) => <KpiStatusBadge status={r.status} completion={r.completion} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(r)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            disabled={!r.active}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
            title={r.active ? "Chuyển sang inactive" : "Đã inactive"}
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
          Tạo KPI
        </Button>
      </div>

      <DataTable columns={columns} rows={rows} />

      <KpiFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        kpis={kpis}
        departments={departments}
        employees={employees}
        onSaved={() => router.refresh()}
      />

      <KpiFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        kpi={editing}
        kpis={kpis}
        departments={departments}
        employees={employees}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Vô hiệu KPI ${deleteTarget?.name ?? ""}?`}
        description="KPI sẽ bị set active=false (soft-delete). Lịch sử target/actual vẫn được giữ. Yêu cầu không có KPI con đang trỏ tới."
        confirmLabel="Inactive KPI"
      />
    </>
  );
}
