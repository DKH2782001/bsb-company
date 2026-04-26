"use client";

import { useState } from "react";
import { Upload, Download } from "lucide-react";
import { ImportDialog, type ImportColumn, type BulkImportResult } from "./ImportDialog";
import { exportToExcel, exportToCSV } from "@/lib/import-export/sheet";

type Props<T extends Record<string, unknown>> = {
  /** Tên hiển thị (vd "Nhân sự", "KPI", ...) */
  entityLabel: string;
  /** Định nghĩa cột import */
  importColumns: ImportColumn[];
  /** Server action — tự bind ở component cha */
  onImport: (rows: Record<string, unknown>[]) => Promise<BulkImportResult>;
  /** Tên file template/export, không cần extension */
  filenameBase: string;

  /** Data hiện có để export */
  exportRows: T[];
  /** Cột export — có thể khác cột import */
  exportColumns: { key: string; header: string }[];
};

export function ImportExportButtons<T extends Record<string, unknown>>({
  entityLabel,
  importColumns,
  onImport,
  filenameBase,
  exportRows,
  exportColumns,
}: Props<T>) {
  const [importOpen, setImportOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export ({exportRows.length})
          </button>
          {exportMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-zinc-200 rounded-lg shadow-lg min-w-[160px] py-1">
                <button
                  onClick={() => { exportToExcel(exportRows, exportColumns, filenameBase); setExportMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 flex items-center gap-2"
                >
                  📊 Excel (.xlsx)
                </button>
                <button
                  onClick={() => { exportToCSV(exportRows, exportColumns, filenameBase); setExportMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 flex items-center gap-2"
                >
                  📄 CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={`Import ${entityLabel}`}
        templateFilename={`template_${filenameBase}`}
        columns={importColumns}
        onImport={onImport}
      />
    </>
  );
}
