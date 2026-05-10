import Link from "next/link";
import { Download, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApprovalDataColumns, getApprovalValueByLabel } from "@/lib/approvals/requestData";
import { fetchApprovals, fetchEmployees } from "@/lib/queries";

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
}

export default async function ApprovalDataPage() {
  const [approvals, employees] = await Promise.all([fetchApprovals(), fetchEmployees()]);
  const completed = approvals.filter((approval) => approval.status === "approved" || approval.status === "rejected");
  const formColumns = getApprovalDataColumns(completed).slice(0, 8);

  return (
    <div>
      <PageHeader
        helpKey="/approval/data"
        title="Quan ly du lieu phe duyet"
        description="Bang du lieu request da hoan tat, ho tro loc/search va chuan bi export Excel/CSV."
        actions={
          <Link
            href="/approval/data/export"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 text-xs font-medium text-[var(--text-strong)] hover:bg-[var(--surface-alt)]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Request da hoan tat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-soft)]" />
            <Input placeholder="Tim trong title, loai request, form data..." className="pl-9" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line-soft)] text-xs uppercase text-[var(--text-soft)]">
                <tr>
                  <th className="px-3 py-3">Request</th>
                  <th className="px-3 py-3">Loai</th>
                  <th className="px-3 py-3">Nguoi gui</th>
                  <th className="px-3 py-3">Trang thai</th>
                  <th className="px-3 py-3">Ngay tao</th>
                  {formColumns.map((column) => (
                    <th key={column.fieldId} className="px-3 py-3">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completed.map((approval) => {
                  const requester = employees.find((employee) => employee.id === approval.requested_by);
                  return (
                    <tr key={approval.id} className="border-b border-[var(--line-soft)]">
                      <td className="px-3 py-3 font-medium text-[var(--text-strong)]">{approval.title}</td>
                      <td className="px-3 py-3 text-[var(--text-soft)]">{approval.kind}</td>
                      <td className="px-3 py-3 text-[var(--text-soft)]">{requester?.full_name ?? "Khong ro"}</td>
                      <td className="px-3 py-3">
                        <Badge variant={approval.status === "approved" ? "success" : "danger"}>{approval.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-[var(--text-soft)]">{formatDate(approval.created_at)}</td>
                      {formColumns.map((column) => (
                        <td key={column.fieldId} className="max-w-[260px] truncate px-3 py-3 text-xs text-[var(--text-soft)]">
                          {getApprovalValueByLabel(approval, column.label) || "-"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {completed.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--line-soft)] p-8 text-center text-sm text-[var(--text-soft)]">
              Chua co request da hoan tat de quan ly du lieu.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
