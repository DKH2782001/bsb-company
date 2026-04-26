"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useToast } from "@/components/ui/toast";
import { EmployeeFormDialog } from "./EmployeeFormDialog";
import { deleteEmployeeAction } from "@/app/(app)/workspace/actions";
import { bulkImportEmployeesAction } from "@/app/(app)/_actions/bulk-import";
import { ImportExportButtons } from "@/components/import-export/ImportExportButtons";
import type { ImportColumn } from "@/components/import-export/ImportDialog";
import { formatCompactVND } from "@/lib/utils";
import type { Department, Employee } from "@/types/domain";

const EMPLOYEE_IMPORT_COLUMNS: ImportColumn[] = [
  { header: "fullName",      key: "fullName",      required: true,  hint: "Họ tên đầy đủ", sample: "Nguyễn Văn A" },
  { header: "email",         key: "email",         required: true,  hint: "Email duy nhất",  sample: "vana@company.vn",
    validate: (v) => (typeof v === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : "Email không hợp lệ") },
  { header: "departmentId",  key: "departmentId",                  hint: "ID phòng ban (xem trang Departments)", sample: "" },
  { header: "managerId",     key: "managerId",                     hint: "ID quản lý",                              sample: "" },
  { header: "baseSalary",    key: "baseSalary",    required: true,  hint: "Lương cơ bản (VND)", sample: 15_000_000,
    validate: (v) => (Number(v) > 0 ? null : "Lương phải > 0") },
  { header: "employmentType",key: "employmentType",                 hint: "fulltime / parttime / contract", sample: "fulltime",
    validate: (v) => {
      if (!v) return null;
      const ok = ["fulltime", "parttime", "contract"].includes(String(v));
      return ok ? null : "employmentType phải là fulltime/parttime/contract";
    } },
];

type Row = Employee & { dept_name: string; manager_name: string; kpi_count: number };

export function PeopleManager({
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
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Employee | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteEmployeeAction(deleteTarget.id);
    if (res.ok) {
      toast({ variant: "success", title: "Đã chuyển sang terminated", description: deleteTarget.full_name });
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Lỗi", description: res.error });
    }
  };

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Nhân sự",
      render: (e) => (
        <Link href={`/people/${e.id}`} className="flex items-center gap-3 hover:text-indigo-700">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {e.full_name.slice(0, 1)}
          </div>
          <div>
            <div className="font-medium text-zinc-900">{e.full_name}</div>
            <div className="text-xs text-zinc-500">{e.email}</div>
          </div>
        </Link>
      ),
    },
    { key: "dept", header: "Phòng ban", render: (e) => e.dept_name },
    { key: "manager", header: "Manager", render: (e) => e.manager_name },
    {
      key: "salary",
      header: "Lương cơ bản",
      align: "right",
      render: (e) => formatCompactVND(e.base_salary),
    },
    { key: "kpi", header: "KPI", align: "right", render: (e) => String(e.kpi_count) },
    {
      key: "status",
      header: "Trạng thái",
      align: "right",
      render: (e) => (
        <Badge variant={e.status === "active" ? "success" : "outline"}>{e.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(e)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label={`Sửa ${e.full_name}`}
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(e)}
            disabled={e.status === "terminated"}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={`Xoá ${e.full_name}`}
            title={e.status === "terminated" ? "Đã terminated" : "Chuyển sang terminated"}
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
          entityLabel="nhân sự"
          filenameBase="employees"
          importColumns={EMPLOYEE_IMPORT_COLUMNS}
          onImport={bulkImportEmployeesAction}
          exportRows={rows}
          exportColumns={[
            { key: "id", header: "id" },
            { key: "full_name", header: "Họ tên" },
            { key: "email", header: "Email" },
            { key: "dept_name", header: "Phòng ban" },
            { key: "manager_name", header: "Quản lý" },
            { key: "base_salary", header: "Lương cơ bản" },
            { key: "employment_type", header: "Loại hợp đồng" },
            { key: "status", header: "Trạng thái" },
          ]}
        />
        <Button type="button" onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4" />
          Thêm nhân sự
        </Button>
      </div>

      <DataTable columns={columns} rows={rows} />

      <EmployeeFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        departments={departments}
        managers={employees}
        onSaved={() => router.refresh()}
      />

      <EmployeeFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        employee={editing}
        departments={departments}
        managers={employees}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xoá nhân sự ${deleteTarget?.full_name ?? ""}?`}
        description="Hành động sẽ chuyển trạng thái nhân sự sang 'terminated' (soft delete). KPI và lịch sử lương vẫn được giữ. Có thể khôi phục bằng cách edit lại trạng thái."
        confirmLabel="Chuyển sang terminated"
      />
    </>
  );
}
