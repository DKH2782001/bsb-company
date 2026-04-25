import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { BarCompare } from "@/components/charts/BarCompare";
import { fetchAccounting, fetchPayroll, fetchDepartments } from "@/lib/queries";
import { formatVND } from "@/lib/utils";

export const revalidate = 300;

export default async function PnlPage() {
  const [entries, payroll, departments] = await Promise.all([
    fetchAccounting(),
    fetchPayroll(),
    fetchDepartments(),
  ]);

  const revenue = entries.filter((e) => e.account_code === "511").reduce((s, e) => s + e.credit, 0);
  const cogs = entries.filter((e) => e.account_code === "632").reduce((s, e) => s + e.debit, 0);
  const sellingExp = entries.filter((e) => e.account_code === "641").reduce((s, e) => s + e.debit, 0);
  const adminExp = entries.filter((e) => e.account_code === "642").reduce((s, e) => s + e.debit, 0);
  const payrollExp = payroll.reduce((s, p) => s + p.company_cost, 0);

  const grossProfit = revenue - cogs;
  const ebitda = grossProfit - sellingExp - adminExp;
  const netProfit = ebitda - payrollExp;

  type Line = { id: string; label: string; amount: number; bold?: boolean; highlight?: "positive" | "negative" };
  const lines: Line[] = [
    { id: "rev", label: "Doanh thu bán hàng (511)", amount: revenue },
    { id: "cogs", label: "Giá vốn hàng bán (632)", amount: -cogs },
    { id: "gp", label: "Gross Profit", amount: grossProfit, bold: true, highlight: "positive" },
    { id: "sell", label: "Chi phí bán hàng (641)", amount: -sellingExp },
    { id: "admin", label: "Chi phí quản lý (642)", amount: -adminExp },
    { id: "ebitda", label: "EBITDA", amount: ebitda, bold: true },
    { id: "payroll", label: "Payroll cost", amount: -payrollExp },
    { id: "np", label: "Net Profit", amount: netProfit, bold: true, highlight: netProfit >= 0 ? "positive" : "negative" },
  ];

  const byDept = departments.map((d) => {
    const deptEntries = entries.filter((e) => e.department_id === d.id);
    const deptRev = deptEntries.filter((e) => e.account_code === "511").reduce((s, e) => s + e.credit, 0);
    const deptExp = deptEntries.filter((e) => ["641", "642", "632"].includes(e.account_code)).reduce((s, e) => s + e.debit, 0);
    return { label: d.name, revenue: deptRev, expense: deptExp };
  });

  const columns: Column<Line>[] = [
    {
      key: "label",
      header: "Khoản mục",
      render: (l) => <span className={l.bold ? "font-semibold" : ""}>{l.label}</span>,
    },
    {
      key: "amount",
      header: "Số tiền",
      align: "right",
      render: (l) => (
        <span
          className={`${l.bold ? "font-semibold" : ""} ${
            l.highlight === "positive"
              ? "text-emerald-700"
              : l.highlight === "negative"
                ? "text-red-700"
                : ""
          }`}
        >
          {formatVND(l.amount)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Báo cáo kết quả kinh doanh"
        description="P&L tháng 04/2026"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>P&L chi tiết</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={lines} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu vs chi phí theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent>
            <BarCompare
              data={byDept}
              bars={[
                { key: "revenue", name: "Doanh thu", color: "#6366f1" },
                { key: "expense", name: "Chi phí", color: "#ef4444" },
              ]}
              height={280}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
