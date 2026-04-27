"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Files, Link2, Paperclip, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useAppContext } from "@/components/layout/AppContext";
import { StorageUploadDropzone } from "@/components/storage/StorageUploadDropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Select } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/tables/DataTable";
import {
  createContractAmendmentAction,
  createEmployeeDocumentAction,
  deleteEmployeeDependentAction,
  deleteEmployeeDocumentAction,
  upsertContractAction,
  upsertEmployeeDependentAction,
} from "@/app/(app)/people/contracts/actions";
import { formatCompactVND, formatDateVN } from "@/lib/utils";
import type {
  ContractAmendment,
  Employee,
  EmployeeDependent,
  EmployeeDocument,
  EmploymentContract,
} from "@/types/domain";
import type { StoredFile } from "@/lib/storage/config";

type ContractRow = EmploymentContract & {
  employee_name: string;
  department_name: string;
};

type AmendmentRow = ContractAmendment & {
  contract_label: string;
  change_summary: string;
};

type DocumentRow = EmployeeDocument & {
  employee_name: string;
  file_url: string | null;
};

type DependentRow = EmployeeDependent & {
  employee_name: string;
};

const CONTRACT_TYPE_OPTIONS = [
  { value: "probation", label: "Thử việc" },
  { value: "fixed_term", label: "Có thời hạn" },
  { value: "indefinite", label: "Không thời hạn" },
  { value: "internship", label: "Thực tập" },
  { value: "collaborator", label: "Cộng tác viên" },
] as const;

const CONTRACT_STATUS_OPTIONS = [
  { value: "draft", label: "Nháp" },
  { value: "active", label: "Hiệu lực" },
  { value: "expiring_soon", label: "Sắp hết hạn" },
  { value: "expired", label: "Hết hạn" },
  { value: "terminated", label: "Chấm dứt" },
  { value: "renewed", label: "Gia hạn" },
] as const;

const DOCUMENT_TYPE_OPTIONS = [
  "contract_pdf",
  "cccd_front",
  "cccd_back",
  "degree",
  "certificate",
  "bhxh",
  "tax",
  "other",
];

function statusBadge(status: ContractRow["status"]) {
  switch (status) {
    case "active":
      return { label: "Hiệu lực", variant: "success" as const };
    case "expiring_soon":
      return { label: "Sắp hết hạn", variant: "warning" as const };
    case "expired":
      return { label: "Hết hạn", variant: "danger" as const };
    case "terminated":
      return { label: "Chấm dứt", variant: "outline" as const };
    case "renewed":
      return { label: "Gia hạn", variant: "info" as const };
    default:
      return { label: "Nháp", variant: "outline" as const };
  }
}

export function ContractsManager({
  contracts,
  amendments,
  documents,
  dependents,
  employees,
}: {
  contracts: ContractRow[];
  amendments: AmendmentRow[];
  documents: DocumentRow[];
  dependents: DependentRow[];
  employees: Employee[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { roles } = useAppContext();
  const canManage = roles.some((role) => role === "ceo" || role === "hr_admin");

  const [creatingContract, setCreatingContract] = React.useState(false);
  const [editingContract, setEditingContract] = React.useState<ContractRow | null>(null);
  const [addingAmendment, setAddingAmendment] = React.useState(false);
  const [uploadingDocument, setUploadingDocument] = React.useState(false);
  const [creatingDependent, setCreatingDependent] = React.useState(false);
  const [editingDependent, setEditingDependent] = React.useState<DependentRow | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = React.useState<DocumentRow | null>(null);
  const [deleteDependentTarget, setDeleteDependentTarget] = React.useState<DependentRow | null>(null);

  const contractColumns: Column<ContractRow>[] = [
    {
      key: "employee",
      header: "Nhân sự",
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900">{row.employee_name}</div>
          <div className="text-xs text-zinc-500">{row.code ?? "Chưa có mã"}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Loại",
      render: (row) => CONTRACT_TYPE_OPTIONS.find((option) => option.value === row.contract_type)?.label ?? row.contract_type,
    },
    {
      key: "period",
      header: "Hiệu lực",
      render: (row) => (
        <div>
          <div>{formatDateVN(row.starts_at)}</div>
          <div className="text-xs text-zinc-500">{row.ends_at ? `→ ${formatDateVN(row.ends_at)}` : "Không thời hạn"}</div>
        </div>
      ),
    },
    {
      key: "salary",
      header: "Lương",
      align: "right",
      render: (row) => formatCompactVND(row.base_salary),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "right",
      render: (row) => {
        const badge = statusBadge(row.status);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        canManage ? (
          <button
            type="button"
            onClick={() => setEditingContract(row)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            title="Sửa hợp đồng"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null,
    },
  ];

  const amendmentColumns: Column<AmendmentRow>[] = [
    {
      key: "contract",
      header: "Hợp đồng",
      render: (row) => row.contract_label,
    },
    {
      key: "effective",
      header: "Hiệu lực",
      render: (row) => formatDateVN(row.effective_from),
    },
    {
      key: "summary",
      header: "Nội dung",
      render: (row) => <span className="line-clamp-2 text-zinc-600">{row.change_summary}</span>,
    },
  ];

  const documentColumns: Column<DocumentRow>[] = [
    {
      key: "employee",
      header: "Nhân sự",
      render: (row) => row.employee_name,
    },
    {
      key: "label",
      header: "Hồ sơ",
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900">{row.label}</div>
          <div className="text-xs text-zinc-500">{row.doc_type}</div>
        </div>
      ),
    },
    {
      key: "expires",
      header: "Hết hạn",
      render: (row) => (row.expires_on ? formatDateVN(row.expires_on) : "—"),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.file_url ? (
            <a
              href={row.file_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              title="Mở file"
            >
              <Link2 className="h-4 w-4" />
            </a>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => setDeleteDocTarget(row)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
              title="Xoá hồ sơ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  const dependentColumns: Column<DependentRow>[] = [
    {
      key: "employee",
      header: "Nhân sự",
      render: (row) => row.employee_name,
    },
    {
      key: "name",
      header: "Người phụ thuộc",
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900">{row.full_name}</div>
          <div className="text-xs text-zinc-500">{row.relationship}</div>
        </div>
      ),
    },
    {
      key: "tax",
      header: "MST / hiệu lực",
      render: (row) => (
        <div>
          <div>{row.tax_code ?? "—"}</div>
          <div className="text-xs text-zinc-500">{row.starts_on ? formatDateVN(row.starts_on) : "—"}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setEditingDependent(row)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              title="Sửa"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteDependentTarget(row)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
              title="Xoá"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null,
    },
  ];

  async function handleDeleteDocument() {
    if (!deleteDocTarget) return;
    const res = await deleteEmployeeDocumentAction(deleteDocTarget.id);
    if (!res.ok) {
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Đã xoá hồ sơ", description: deleteDocTarget.label });
    setDeleteDocTarget(null);
    router.refresh();
  }

  async function handleDeleteDependent() {
    if (!deleteDependentTarget) return;
    const res = await deleteEmployeeDependentAction(deleteDependentTarget.id);
    if (!res.ok) {
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Đã xoá người phụ thuộc", description: deleteDependentTarget.full_name });
    setDeleteDependentTarget(null);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Danh sách hợp đồng</CardTitle>
              <div className="mt-1 text-xs text-zinc-500">
                Workspace metadata cho hợp đồng, file ký và phụ lục theo mẫu nội bộ công ty.
              </div>
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingAmendment(true)}>
                  <Files className="h-4 w-4" />
                  Phụ lục
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setUploadingDocument(true)}>
                  <Paperclip className="h-4 w-4" />
                  Upload hồ sơ
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setCreatingDependent(true)}>
                  <Users className="h-4 w-4" />
                  Người phụ thuộc
                </Button>
                <Button type="button" size="sm" onClick={() => setCreatingContract(true)}>
                  <FilePlus2 className="h-4 w-4" />
                  Hợp đồng mới
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <DataTable columns={contractColumns} rows={contracts} />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Phụ lục gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={amendmentColumns} rows={amendments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hồ sơ nhân sự</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={documentColumns} rows={documents} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Người phụ thuộc</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={dependentColumns} rows={dependents} />
          </CardContent>
        </Card>
      </div>

      <ContractDialog
        open={creatingContract}
        onClose={() => setCreatingContract(false)}
        employees={employees}
        onSaved={() => router.refresh()}
      />
      <ContractDialog
        open={Boolean(editingContract)}
        onClose={() => setEditingContract(null)}
        employees={employees}
        contract={editingContract}
        onSaved={() => router.refresh()}
      />
      <AmendmentDialog
        open={addingAmendment}
        onClose={() => setAddingAmendment(false)}
        contracts={contracts}
        onSaved={() => router.refresh()}
      />
      <DocumentUploadDialog
        open={uploadingDocument}
        onClose={() => setUploadingDocument(false)}
        employees={employees}
        onSaved={() => router.refresh()}
      />
      <DependentDialog
        open={creatingDependent}
        onClose={() => setCreatingDependent(false)}
        employees={employees}
        onSaved={() => router.refresh()}
      />
      <DependentDialog
        open={Boolean(editingDependent)}
        onClose={() => setEditingDependent(null)}
        employees={employees}
        dependent={editingDependent}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteDocTarget)}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={handleDeleteDocument}
        title={`Xoá hồ sơ ${deleteDocTarget?.label ?? ""}?`}
        description="Bản ghi hồ sơ sẽ bị xoá khỏi màn hình quản lý. File trên storage không bị dọn tự động trong bản MVP này."
        confirmLabel="Xoá hồ sơ"
      />
      <ConfirmDialog
        open={Boolean(deleteDependentTarget)}
        onClose={() => setDeleteDependentTarget(null)}
        onConfirm={handleDeleteDependent}
        title={`Xoá người phụ thuộc ${deleteDependentTarget?.full_name ?? ""}?`}
        description="Thao tác này chỉ xoá bản ghi người phụ thuộc khỏi hệ thống."
        confirmLabel="Xoá người phụ thuộc"
      />
    </>
  );
}

function ContractDialog({
  open,
  onClose,
  contract,
  employees,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  contract?: ContractRow | null;
  employees: Employee[];
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const isEdit = Boolean(contract?.id);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    id: "",
    employeeId: "",
    code: "",
    contractType: "fixed_term",
    status: "active",
    startsAt: "",
    endsAt: "",
    probationEndsAt: "",
    signedAt: "",
    baseSalary: "0",
    currency: "VND",
    noticePeriodDays: "30",
    workingHoursPerWeek: "40",
    documentUrl: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setServerError(null);
    setForm({
      id: contract?.id ?? "",
      employeeId: contract?.employee_id ?? employees[0]?.id ?? "",
      code: contract?.code ?? "",
      contractType: contract?.contract_type ?? "fixed_term",
      status: contract?.status ?? "active",
      startsAt: contract?.starts_at ?? new Date().toISOString().slice(0, 10),
      endsAt: contract?.ends_at ?? "",
      probationEndsAt: contract?.probation_ends_at ?? "",
      signedAt: contract?.signed_at ?? "",
      baseSalary: String(contract?.base_salary ?? 0),
      currency: contract?.currency ?? "VND",
      noticePeriodDays: String(contract?.notice_period_days ?? 30),
      workingHoursPerWeek: String(contract?.working_hours_per_week ?? 40),
      documentUrl: contract?.document_url ?? "",
      notes: contract?.notes ?? "",
    });
  }, [open, contract, employees]);

  async function submit() {
    setServerError(null);
    const res = await upsertContractAction({
      id: form.id || undefined,
      employeeId: form.employeeId,
      code: form.code || undefined,
      contractType: form.contractType as "probation" | "fixed_term" | "indefinite" | "internship" | "collaborator",
      status: form.status as "draft" | "active" | "expiring_soon" | "expired" | "terminated" | "renewed",
      startsAt: form.startsAt,
      endsAt: form.endsAt || undefined,
      probationEndsAt: form.probationEndsAt || undefined,
      signedAt: form.signedAt || undefined,
      baseSalary: Number(form.baseSalary || 0),
      currency: form.currency,
      noticePeriodDays: Number(form.noticePeriodDays || 0),
      workingHoursPerWeek: Number(form.workingHoursPerWeek || 0),
      documentUrl: form.documentUrl || undefined,
      notes: form.notes || undefined,
    });

    if (!res.ok) {
      setServerError(res.error);
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }

    toast({
      variant: "success",
      title: isEdit ? "Đã cập nhật hợp đồng" : "Đã tạo hợp đồng",
      description: employees.find((employee) => employee.id === form.employeeId)?.full_name ?? "",
    });
    onSaved?.();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng mới"}
      description="Tập trung vào metadata, file và tình trạng ký. Nội dung pháp lý do công ty tự quản lý."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="button" onClick={submit}>
            {isEdit ? "Cập nhật" : "Tạo hợp đồng"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nhân sự" required>
          <Select value={form.employeeId} onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}>
            <option value="">Chọn nhân sự</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Mã hợp đồng">
          <Input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="HD-2026-001" />
        </FormField>
        <FormField label="Loại hợp đồng">
          <Select value={form.contractType} onChange={(event) => setForm((prev) => ({ ...prev, contractType: event.target.value }))}>
            {CONTRACT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Trạng thái">
          <Select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
            {CONTRACT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ngày hiệu lực" required>
          <Input type="date" value={form.startsAt} onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
        </FormField>
        <FormField label="Ngày hết hạn">
          <Input type="date" value={form.endsAt} onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
        </FormField>
        <FormField label="Kết thúc thử việc">
          <Input type="date" value={form.probationEndsAt} onChange={(event) => setForm((prev) => ({ ...prev, probationEndsAt: event.target.value }))} />
        </FormField>
        <FormField label="Ngày ký">
          <Input type="date" value={form.signedAt} onChange={(event) => setForm((prev) => ({ ...prev, signedAt: event.target.value }))} />
        </FormField>
        <FormField label="Lương cơ bản (VND)" required>
          <Input type="number" min={0} step={1000} value={form.baseSalary} onChange={(event) => setForm((prev) => ({ ...prev, baseSalary: event.target.value }))} />
        </FormField>
        <FormField label="Tiền tệ">
          <Input value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))} />
        </FormField>
        <FormField label="Notice period (ngày)">
          <Input type="number" min={0} step={1} value={form.noticePeriodDays} onChange={(event) => setForm((prev) => ({ ...prev, noticePeriodDays: event.target.value }))} />
        </FormField>
        <FormField label="Giờ làm việc / tuần">
          <Input type="number" min={0} step={0.5} value={form.workingHoursPerWeek} onChange={(event) => setForm((prev) => ({ ...prev, workingHoursPerWeek: event.target.value }))} />
        </FormField>
        <FormField label="Link file hợp đồng" className="sm:col-span-2">
          <Input value={form.documentUrl} onChange={(event) => setForm((prev) => ({ ...prev, documentUrl: event.target.value }))} placeholder="https://... hoặc link storage đã ký" />
        </FormField>
        <FormField label="Ghi chú" className="sm:col-span-2">
          <textarea
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-3 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            placeholder="Điều khoản nội bộ, người ký, lưu ý vận hành..."
          />
        </FormField>
        {serverError ? (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        ) : null}
      </div>
    </Dialog>
  );
}

function AmendmentDialog({
  open,
  onClose,
  contracts,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  contracts: ContractRow[];
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    contractId: "",
    effectiveFrom: "",
    summary: "",
    reason: "",
    documentUrl: "",
    signedAt: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setServerError(null);
    setForm({
      contractId: contracts[0]?.id ?? "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      summary: "",
      reason: "",
      documentUrl: "",
      signedAt: "",
    });
  }, [open, contracts]);

  async function submit() {
    const res = await createContractAmendmentAction({
      contractId: form.contractId,
      effectiveFrom: form.effectiveFrom,
      summary: form.summary,
      reason: form.reason || undefined,
      documentUrl: form.documentUrl || undefined,
      signedAt: form.signedAt || undefined,
    });
    if (!res.ok) {
      setServerError(res.error);
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Đã thêm phụ lục", description: form.summary });
    onSaved?.();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Thêm phụ lục"
      description="Ghi nhận thay đổi về lương, chức danh, địa điểm hoặc điều khoản riêng của công ty."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="button" onClick={submit}>
            Lưu phụ lục
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Hợp đồng" required className="sm:col-span-2">
          <Select value={form.contractId} onChange={(event) => setForm((prev) => ({ ...prev, contractId: event.target.value }))}>
            <option value="">Chọn hợp đồng</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.code ?? contract.employee_name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ngày hiệu lực" required>
          <Input type="date" value={form.effectiveFrom} onChange={(event) => setForm((prev) => ({ ...prev, effectiveFrom: event.target.value }))} />
        </FormField>
        <FormField label="Ngày ký">
          <Input type="date" value={form.signedAt} onChange={(event) => setForm((prev) => ({ ...prev, signedAt: event.target.value }))} />
        </FormField>
        <FormField label="Lý do">
          <Input value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Promotion / salary update..." />
        </FormField>
        <FormField label="Link file phụ lục">
          <Input value={form.documentUrl} onChange={(event) => setForm((prev) => ({ ...prev, documentUrl: event.target.value }))} placeholder="https://..." />
        </FormField>
        <FormField label="Nội dung thay đổi" required className="sm:col-span-2">
          <textarea
            value={form.summary}
            onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-3 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            placeholder="Ví dụ: tăng lương lên 22 triệu từ 01/05/2026..."
          />
        </FormField>
        {serverError ? <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div> : null}
      </div>
    </Dialog>
  );
}

function DocumentUploadDialog({
  open,
  onClose,
  employees,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = React.useState<StoredFile | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    employeeId: "",
    docType: "other",
    label: "",
    expiresOn: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setUploadedFile(null);
    setServerError(null);
    setForm({
      employeeId: employees[0]?.id ?? "",
      docType: "other",
      label: "",
      expiresOn: "",
    });
  }, [open, employees]);

  async function submit() {
    if (!uploadedFile) {
      setServerError("Cần upload file trước khi lưu hồ sơ.");
      return;
    }
    const res = await createEmployeeDocumentAction({
      employeeId: form.employeeId,
      docType: form.docType,
      label: form.label || uploadedFile.name,
      storagePath: uploadedFile.path,
      mimeType: uploadedFile.mimeType,
      sizeBytes: uploadedFile.size,
      expiresOn: form.expiresOn || undefined,
    });
    if (!res.ok) {
      setServerError(res.error);
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Đã lưu hồ sơ", description: form.label || uploadedFile.name });
    onSaved?.();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Upload hồ sơ"
      description="Lưu CCCD, bằng cấp, PDF hợp đồng ký hoặc tài liệu nhân sự riêng của công ty."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="button" onClick={submit}>
            Lưu hồ sơ
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nhân sự" required>
          <Select value={form.employeeId} onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}>
            <option value="">Chọn nhân sự</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Loại hồ sơ">
          <Select value={form.docType} onChange={(event) => setForm((prev) => ({ ...prev, docType: event.target.value }))}>
            {DOCUMENT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tên hiển thị" className="sm:col-span-2">
          <Input value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} placeholder="CCCD mặt trước / Hợp đồng PDF / Bằng cấp..." />
        </FormField>
        <FormField label="Ngày hết hạn" className="sm:col-span-2">
          <Input type="date" value={form.expiresOn} onChange={(event) => setForm((prev) => ({ ...prev, expiresOn: event.target.value }))} />
        </FormField>
        <div className="sm:col-span-2">
          <StorageUploadDropzone bucket="documents" compact onUploaded={(file) => setUploadedFile(file)} />
        </div>
        {uploadedFile ? (
          <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            File sẵn sàng lưu: {uploadedFile.name}
          </div>
        ) : null}
        {serverError ? <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div> : null}
      </div>
    </Dialog>
  );
}

function DependentDialog({
  open,
  onClose,
  dependent,
  employees,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  dependent?: DependentRow | null;
  employees: Employee[];
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const isEdit = Boolean(dependent?.id);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    id: "",
    employeeId: "",
    fullName: "",
    relationship: "",
    dateOfBirth: "",
    nationalId: "",
    taxCode: "",
    startsOn: "",
    endsOn: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setServerError(null);
    setForm({
      id: dependent?.id ?? "",
      employeeId: dependent?.employee_id ?? employees[0]?.id ?? "",
      fullName: dependent?.full_name ?? "",
      relationship: dependent?.relationship ?? "",
      dateOfBirth: dependent?.date_of_birth ?? "",
      nationalId: dependent?.national_id ?? "",
      taxCode: dependent?.tax_code ?? "",
      startsOn: dependent?.starts_on ?? "",
      endsOn: dependent?.ends_on ?? "",
      notes: dependent?.notes ?? "",
    });
  }, [open, dependent, employees]);

  async function submit() {
    const res = await upsertEmployeeDependentAction({
      id: form.id || undefined,
      employeeId: form.employeeId,
      fullName: form.fullName,
      relationship: form.relationship,
      dateOfBirth: form.dateOfBirth || undefined,
      nationalId: form.nationalId || undefined,
      taxCode: form.taxCode || undefined,
      startsOn: form.startsOn || undefined,
      endsOn: form.endsOn || undefined,
      notes: form.notes || undefined,
    });
    if (!res.ok) {
      setServerError(res.error);
      toast({ variant: "error", title: "Lỗi", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Đã cập nhật" : "Đã thêm người phụ thuộc", description: form.fullName });
    onSaved?.();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Sửa người phụ thuộc" : "Thêm người phụ thuộc"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="button" onClick={submit}>
            {isEdit ? "Cập nhật" : "Lưu"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nhân sự" required>
          <Select value={form.employeeId} onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}>
            <option value="">Chọn nhân sự</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quan hệ" required>
          <Input value={form.relationship} onChange={(event) => setForm((prev) => ({ ...prev, relationship: event.target.value }))} placeholder="Con / Mẹ / Vợ..." />
        </FormField>
        <FormField label="Họ tên" required className="sm:col-span-2">
          <Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
        </FormField>
        <FormField label="Ngày sinh">
          <Input type="date" value={form.dateOfBirth} onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} />
        </FormField>
        <FormField label="CCCD/ID">
          <Input value={form.nationalId} onChange={(event) => setForm((prev) => ({ ...prev, nationalId: event.target.value }))} />
        </FormField>
        <FormField label="Mã số thuế">
          <Input value={form.taxCode} onChange={(event) => setForm((prev) => ({ ...prev, taxCode: event.target.value }))} />
        </FormField>
        <FormField label="Hiệu lực từ">
          <Input type="date" value={form.startsOn} onChange={(event) => setForm((prev) => ({ ...prev, startsOn: event.target.value }))} />
        </FormField>
        <FormField label="Đến ngày">
          <Input type="date" value={form.endsOn} onChange={(event) => setForm((prev) => ({ ...prev, endsOn: event.target.value }))} />
        </FormField>
        <FormField label="Ghi chú" className="sm:col-span-2">
          <textarea
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={3}
            className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 py-3 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          />
        </FormField>
        {serverError ? <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div> : null}
      </div>
    </Dialog>
  );
}
