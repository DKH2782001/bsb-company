import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { KpiCard } from "@/components/kpi/KpiCard";
import { formatVND, formatCompactVND } from "@/lib/utils";

type Line = { id: string; label: string; amount: number; bold?: boolean };

const operating: Line[] = [
  { id: "in_cust", label: "Thu tiền từ khách hàng", amount: 5_050_000_000 },
  { id: "out_supp", label: "Chi cho nhà cung cấp", amount: -3_000_000_000 },
  { id: "out_emp", label: "Chi cho nhân viên", amount: -560_000_000 },
  { id: "out_tax", label: "Thuế đã nộp", amount: -220_000_000 },
  { id: "ocf", label: "Net Operating Cash Flow", amount: 1_270_000_000, bold: true },
];

const investing: Line[] = [
  { id: "ppe", label: "Mua TSCĐ", amount: -180_000_000 },
  { id: "tool", label: "Phần mềm / công cụ", amount: -70_000_000 },
  { id: "icf", label: "Net Investing Cash Flow", amount: -250_000_000, bold: true },
];

const financing: Line[] = [
  { id: "loan_in", label: "Vay mới", amount: 0 },
  { id: "loan_out", label: "Trả nợ vay", amount: -150_000_000 },
  { id: "div", label: "Chia cổ tức", amount: 0 },
  { id: "fcf", label: "Net Financing Cash Flow", amount: -150_000_000, bold: true },
];

const trend = [
  { label: "T11", value: 14_800_000_000 },
  { label: "T12", value: 15_200_000_000 },
  { label: "T1", value: 15_900_000_000 },
  { label: "T2", value: 16_500_000_000 },
  { label: "T3", value: 17_400_000_000 },
  { label: "T4", value: 18_400_000_000 },
];

export default function CashflowPage() {
  const columns: Column<Line>[] = [
    { key: "label", header: "Khoản mục", render: (l) => <span className={l.bold ? "font-semibold" : ""}>{l.label}</span> },
    {
      key: "amount",
      header: "Số tiền",
      align: "right",
      render: (l) => (
        <span className={`${l.bold ? "font-semibold" : ""} ${l.amount < 0 ? "text-red-700" : ""}`}>
          {formatVND(l.amount)}
        </span>
      ),
    },
  ];

  const netCash = 1_270_000_000 - 250_000_000 - 150_000_000;

  return (
    <div>
      <PageHeader title="Báo cáo lưu chuyển tiền tệ" description="Cash Flow Statement 04/2026" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Net Cash" value={formatCompactVND(netCash)} delta={3.2} accent="emerald" />
        <KpiCard label="OCF" value={formatCompactVND(1_270_000_000)} accent="indigo" />
        <KpiCard label="ICF" value={formatCompactVND(-250_000_000)} accent="amber" />
        <KpiCard label="FCF" value={formatCompactVND(-150_000_000)} accent="red" />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Xu hướng số dư tiền 6 tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaTrend data={trend} height={220} color="#10b981" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Operating</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={operating} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Investing</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={investing} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financing</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={financing} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
