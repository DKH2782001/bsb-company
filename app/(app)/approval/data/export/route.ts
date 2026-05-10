import { getApprovalDataColumns, getApprovalValueByLabel, toCsvCell } from "@/lib/approvals/requestData";
import { fetchApprovals, fetchEmployees } from "@/lib/queries";

export async function GET() {
  const [approvals, employees] = await Promise.all([fetchApprovals(), fetchEmployees()]);
  const completed = approvals.filter((approval) => approval.status === "approved" || approval.status === "rejected");
  const formColumns = getApprovalDataColumns(completed);
  const headers = ["Request", "Loai", "Nguoi gui", "Trang thai", "Ngay tao", ...formColumns.map((column) => column.label)];

  const rows = completed.map((approval) => {
    const requester = employees.find((employee) => employee.id === approval.requested_by);
    return [
      approval.title,
      approval.kind,
      requester?.full_name ?? "Khong ro",
      approval.status,
      approval.created_at,
      ...formColumns.map((column) => getApprovalValueByLabel(approval, column.label)),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map((cell) => toCsvCell(String(cell))).join(",")).join("\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="approval-data.csv"`,
    },
  });
}
