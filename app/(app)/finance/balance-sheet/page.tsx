import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { formatVND } from "@/lib/utils";

type Line = { id: string; label: string; amount: number; bold?: boolean };

const currentAssets: Line[] = [
  { id: "cash", label: "Tiền mặt", amount: 2_400_000_000 },
  { id: "bank", label: "Tiền gửi ngân hàng", amount: 16_000_000_000 },
  { id: "ar", label: "Phải thu khách hàng", amount: 3_200_000_000 },
  { id: "inv", label: "Hàng tồn kho", amount: 1_800_000_000 },
  { id: "prepaid", label: "Chi phí trả trước", amount: 180_000_000 },
  { id: "tca", label: "Tổng TSNH", amount: 23_580_000_000, bold: true },
];

const nonCurrentAssets: Line[] = [
  { id: "ppe", label: "Tài sản cố định", amount: 2_100_000_000 },
  { id: "intan", label: "Tài sản vô hình", amount: 450_000_000 },
  { id: "deposit", label: "Ký quỹ", amount: 120_000_000 },
  { id: "tnca", label: "Tổng TSDH", amount: 2_670_000_000, bold: true },
];

const liabilities: Line[] = [
  { id: "ap", label: "Phải trả NCC", amount: 1_100_000_000 },
  { id: "std", label: "Nợ ngắn hạn", amount: 800_000_000 },
  { id: "tax", label: "Thuế phải nộp", amount: 220_000_000 },
  { id: "payroll", label: "Lương phải trả", amount: 560_000_000 },
  { id: "other", label: "Nợ khác", amount: 90_000_000 },
  { id: "tliab", label: "Tổng nợ phải trả", amount: 2_770_000_000, bold: true },
];

const equity: Line[] = [
  { id: "cap", label: "Vốn góp chủ sở hữu", amount: 15_000_000_000 },
  { id: "ret", label: "Lợi nhuận giữ lại", amount: 7_760_000_000 },
  { id: "cur", label: "Lợi nhuận năm nay", amount: 720_000_000 },
  { id: "teq", label: "Tổng vốn chủ", amount: 23_480_000_000, bold: true },
];

export default function BalanceSheetPage() {
  const columns: Column<Line>[] = [
    { key: "label", header: "Khoản mục", render: (l) => <span className={l.bold ? "font-semibold" : ""}>{l.label}</span> },
    { key: "amount", header: "Số tiền", align: "right", render: (l) => <span className={l.bold ? "font-semibold" : ""}>{formatVND(l.amount)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Bảng cân đối kế toán" description="Balance Sheet 30/04/2026" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Tài sản ngắn hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={currentAssets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tài sản dài hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={nonCurrentAssets} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Nợ phải trả</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={liabilities} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vốn chủ sở hữu</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} rows={equity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
