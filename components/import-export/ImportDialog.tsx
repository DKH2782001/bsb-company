"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, FileSpreadsheet, Download, Check, X, AlertCircle } from "lucide-react";
import { parseSheetFile, downloadTemplate } from "@/lib/import-export/sheet";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export type ImportColumn<T = unknown> = {
  /** Tên cột trong file Excel (header VN cho user dễ hiểu) */
  header: string;
  /** Key trong record sau khi normalize (sẽ được gửi xuống server) */
  key: string;
  /** Bắt buộc — nếu trống → row được đánh dấu lỗi */
  required?: boolean;
  /** Validate giá trị thô từ sheet → trả error message (string) hoặc null. Có thể chuyển kiểu ở đây. */
  validate?: (value: unknown, row: Record<string, unknown>) => string | null;
  /** Transform value cuối cùng trước khi gửi server */
  transform?: (value: unknown, row: Record<string, unknown>) => T;
  /** Mô tả ngắn để user biết format mong muốn */
  hint?: string;
  /** Sample value cho template */
  sample?: unknown;
};

export type BulkImportResult = {
  inserted: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  templateFilename: string;
  columns: ImportColumn[];
  /** Server action import — nhận mảng record đã transform & valid */
  onImport: (rows: Record<string, unknown>[]) => Promise<BulkImportResult>;
};

type RowState = {
  index: number;
  raw: Record<string, unknown>;
  normalized: Record<string, unknown>;
  errors: string[];
};

export function ImportDialog({ open, onClose, title, templateFilename, columns, onImport }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<RowState[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setStep("upload");
    setFileName("");
    setRows([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    try {
      const { rows: rawRows } = await parseSheetFile(f);
      const normalized: RowState[] = rawRows.map((raw, i) => {
        const errors: string[] = [];
        const out: Record<string, unknown> = {};
        for (const c of columns) {
          const v = raw[c.header];
          if (c.required && (v === "" || v == null)) {
            errors.push(`Thiếu ${c.header}`);
            continue;
          }
          if (c.validate) {
            const err = c.validate(v, raw);
            if (err) errors.push(err);
          }
          out[c.key] = c.transform ? c.transform(v, raw) : v;
        }
        return { index: i + 2, raw, normalized: out, errors }; // +2 vì excel row 1 là header
      });
      setRows(normalized);
      setStep("preview");
    } catch {
      toast({ variant: "error", title: "Đọc file thất bại", description: "File không phải Excel/CSV hợp lệ." });
    }
  }

  function handleDownloadTemplate() {
    const sample: Record<string, unknown> = {};
    for (const c of columns) sample[c.header] = c.sample ?? "";
    downloadTemplate(
      columns.map((c) => ({ key: c.header, header: c.header })),
      templateFilename,
      sample,
    );
  }

  function handleImport() {
    const valid = rows.filter((r) => r.errors.length === 0).map((r) => r.normalized);
    if (valid.length === 0) {
      toast({ variant: "error", title: "Không có dòng hợp lệ", description: "Sửa lỗi trước khi import." });
      return;
    }
    startTransition(async () => {
      try {
        const result = await onImport(valid);
        setImportResult(result);
        setStep("result");
        toast({
          variant: result.failed > 0 ? "info" : "success",
          title: `Đã import ${result.inserted} dòng`,
          description: result.failed > 0 ? `${result.failed} dòng lỗi server-side` : undefined,
        });
        router.refresh();
      } catch (err) {
        toast({
          variant: "error",
          title: "Import thất bại",
          description: err instanceof Error ? err.message : "Lỗi không xác định",
        });
      }
    });
  }

  if (!open) return null;

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const errorCount = rows.length - validCount;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-zinc-800">{title}</h2>
          </div>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {step === "upload" && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center bg-zinc-50">
                <Upload className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
                <div className="text-sm text-zinc-700 font-medium mb-1">Kéo thả file Excel/CSV vào đây hoặc</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                >
                  Chọn file
                </button>
                <div className="text-xs text-zinc-400 mt-3">Hỗ trợ .xlsx, .xls, .csv</div>
              </div>

              <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Download className="h-4 w-4 text-indigo-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-indigo-800">Cần template?</div>
                    <div className="text-xs text-indigo-600">Tải file mẫu với đúng cột header và 1 dòng ví dụ.</div>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-lg bg-white border border-indigo-300 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
                >
                  📥 Tải template Excel
                </button>
              </div>

              <details className="rounded-xl border border-zinc-200 p-3">
                <summary className="cursor-pointer text-sm font-medium text-zinc-700">📋 Cột yêu cầu ({columns.length})</summary>
                <table className="w-full text-xs mt-3">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="text-left py-1">Cột</th>
                      <th className="text-left py-1">Bắt buộc</th>
                      <th className="text-left py-1">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((c) => (
                      <tr key={c.key} className="border-t border-zinc-100">
                        <td className="py-1.5 font-mono text-zinc-700">{c.header}</td>
                        <td className="py-1.5">{c.required ? <span className="text-red-500">●</span> : <span className="text-zinc-300">○</span>}</td>
                        <td className="py-1.5 text-zinc-500">{c.hint ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-zinc-700">{fileName}</span>
                <span className="text-zinc-400">·</span>
                <span className="text-emerald-600">✓ {validCount} hợp lệ</span>
                {errorCount > 0 && <span className="text-red-600">✗ {errorCount} lỗi</span>}
                <button onClick={reset} className="ml-auto text-xs text-indigo-600 hover:underline">Đổi file</button>
              </div>

              {rows.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-400">File không có dữ liệu</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 sticky top-0">
                      <tr>
                        <th className="text-left px-2 py-2 w-10">#</th>
                        <th className="text-left px-2 py-2 w-8">●</th>
                        {columns.map((c) => (
                          <th key={c.key} className="text-left px-2 py-2 whitespace-nowrap">{c.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r) => (
                        <tr key={r.index} className={r.errors.length > 0 ? "bg-red-50" : ""}>
                          <td className="px-2 py-1.5 text-zinc-400 font-mono">{r.index}</td>
                          <td className="px-2 py-1.5" title={r.errors.length > 0 ? r.errors.join("; ") : undefined}>
                            {r.errors.length === 0 ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                            )}
                          </td>
                          {columns.map((c) => (
                            <td key={c.key} className="px-2 py-1.5 text-zinc-700 whitespace-nowrap max-w-[180px] truncate">
                              {String(r.raw[c.header] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 50 && (
                    <div className="text-center text-xs text-zinc-400 py-2 bg-zinc-50">
                      Hiển thị 50 dòng đầu / {rows.length} dòng tổng. Tất cả sẽ được import.
                    </div>
                  )}
                </div>
              )}

              {errorCount > 0 && (
                <details className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <summary className="text-sm font-medium text-red-700 cursor-pointer">
                    ⚠️ {errorCount} dòng có lỗi (sẽ bị bỏ qua khi import)
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-red-600 max-h-[120px] overflow-y-auto">
                    {rows.filter((r) => r.errors.length > 0).slice(0, 20).map((r) => (
                      <li key={r.index}><strong>Dòng {r.index}:</strong> {r.errors.join(", ")}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {step === "result" && importResult && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">{importResult.failed === 0 ? "🎉" : "⚠️"}</div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{importResult.inserted} dòng đã import</div>
                {importResult.failed > 0 && (
                  <div className="text-sm text-red-500 mt-1">{importResult.failed} dòng lỗi server-side</div>
                )}
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="text-left rounded-lg bg-red-50 border border-red-200 p-3 max-h-[180px] overflow-y-auto">
                  <ul className="text-xs text-red-600 space-y-1">
                    {importResult.errors.map((e, i) => (
                      <li key={i}><strong>Dòng {e.row}:</strong> {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 flex justify-between items-center gap-3">
          {step === "preview" && (
            <span className="text-xs text-zinc-500">
              Sẽ import <strong className="text-emerald-600">{validCount}</strong> dòng hợp lệ
              {errorCount > 0 && <>, bỏ qua <strong className="text-red-500">{errorCount}</strong> dòng lỗi</>}
            </span>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700">
              {step === "result" ? "Đóng" : "Huỷ"}
            </button>
            {step === "preview" && (
              <button
                onClick={handleImport}
                disabled={isPending || validCount === 0}
                className="px-5 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? "Đang import..." : <><Check className="h-3.5 w-3.5" /> Import {validCount} dòng</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function handleClose() {
    reset();
    onClose();
  }
}
