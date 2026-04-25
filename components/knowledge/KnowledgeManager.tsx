"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { SopFormDialog } from "./SopFormDialog";
import { deleteSopAction } from "@/app/(app)/workspace/actions";
import type { Department, SopDocument } from "@/types/domain";

export function KnowledgeManager({
  sops,
  departments,
}: {
  sops: SopDocument[];
  departments: Department[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<SopDocument | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SopDocument | null>(null);

  const byDept = departments.map((d) => ({
    dept: d,
    docs: sops.filter((s) => s.department_id === d.id),
  }));
  const orphan = sops.filter((s) => !s.department_id);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteSopAction(deleteTarget.id);
    if (res.ok) {
      toast({ variant: "success", title: "Đã xoá SOP", description: deleteTarget.title });
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Không thể xoá", description: res.error });
    }
  };

  const renderDoc = (d: SopDocument) => (
    <div key={d.id} className="flex items-start gap-2 rounded-lg border border-zinc-100 p-2">
      <FileText className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-zinc-900 truncate">{d.title}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline">v{d.version}</Badge>
          {d.published ? <Badge variant="success">Published</Badge> : <Badge variant="warning">Draft</Badge>}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => setEditing(d)} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" title="Sửa">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => setDeleteTarget(d)} className="rounded-md p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600" title="Xoá">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Tạo SOP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {byDept.map(({ dept, docs }) => (
          <Card key={dept.id} className="border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{dept.name}</CardTitle>
              <div className="text-xs text-zinc-500">{docs.length} tài liệu</div>
            </CardHeader>
            <CardContent className="space-y-2">
              {docs.map(renderDoc)}
              {docs.length === 0 && (
                <div className="text-xs text-zinc-400 text-center py-3">Chưa có SOP</div>
              )}
            </CardContent>
          </Card>
        ))}
        {orphan.length > 0 && (
          <Card className="border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Chưa gán phòng ban</CardTitle>
              <div className="text-xs text-zinc-500">{orphan.length} tài liệu</div>
            </CardHeader>
            <CardContent className="space-y-2">{orphan.map(renderDoc)}</CardContent>
          </Card>
        )}
      </div>

      <SopFormDialog open={creating} onClose={() => setCreating(false)} departments={departments} onSaved={() => router.refresh()} />
      <SopFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        sop={editing}
        departments={departments}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xoá SOP "${deleteTarget?.title ?? ""}"?`}
        description="Hành động này xoá vĩnh viễn tài liệu khỏi hệ thống. Lịch sử version cũng mất."
        confirmLabel="Xoá SOP"
      />
    </>
  );
}
