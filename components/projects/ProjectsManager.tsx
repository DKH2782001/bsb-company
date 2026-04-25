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
import { ProjectFormDialog } from "./ProjectFormDialog";
import { deleteProjectAction } from "@/app/(app)/workspace/actions";
import { formatCompactVND } from "@/lib/utils";
import type { Employee, Project } from "@/types/domain";

type Row = Project & { owner_name: string };

const statusTone: Record<Project["status"], "success" | "info" | "warning" | "outline" | "danger"> = {
  draft: "outline",
  active: "info",
  paused: "warning",
  done: "success",
  cancelled: "danger",
};

export function ProjectsManager({ rows, employees }: { rows: Row[]; employees: Employee[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteProjectAction(deleteTarget.id);
    if (res.ok) {
      toast({ variant: "success", title: "Đã huỷ dự án", description: deleteTarget.name });
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Không thể huỷ", description: res.error });
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Dự án",
      render: (p) => (
        <Link href={`/projects/${p.id}`} className="font-medium hover:text-indigo-700">
          {p.name}
          <div className="text-xs text-zinc-500 font-mono">{p.code}</div>
        </Link>
      ),
    },
    { key: "owner", header: "Owner", render: (p) => p.owner_name },
    { key: "budget", header: "Budget", align: "right", render: (p) => formatCompactVND(p.budget) },
    { key: "start", header: "Bắt đầu", render: (p) => p.starts_at ?? "—" },
    { key: "end", header: "Kết thúc", render: (p) => p.ends_at ?? "—" },
    {
      key: "status",
      header: "Trạng thái",
      align: "right",
      render: (p) => <Badge variant={statusTone[p.status]}>{p.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(p)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(p)}
            disabled={p.status === "cancelled"}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
            title={p.status === "cancelled" ? "Đã cancel" : "Huỷ dự án"}
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
          Tạo dự án
        </Button>
      </div>

      <DataTable columns={columns} rows={rows} />

      <ProjectFormDialog open={creating} onClose={() => setCreating(false)} employees={employees} onSaved={() => router.refresh()} />
      <ProjectFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        project={editing}
        employees={employees}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Huỷ dự án ${deleteTarget?.name ?? ""}?`}
        description="Dự án sẽ chuyển sang trạng thái cancelled (soft delete). Có thể chỉnh lại trạng thái sau khi cần."
        confirmLabel="Huỷ dự án"
      />
    </>
  );
}
