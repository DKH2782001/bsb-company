/**
 * Helpers cho Bulk Import/Export — chạy ở client (parse file user upload)
 * và export blob để user tải.
 */
import * as XLSX from "xlsx";

/** Parse file Excel/CSV của user → array of records (key = column header). */
export async function parseSheetFile(file: File): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { headers: [], rows: [] };

  const sheet = workbook.Sheets[firstSheetName];
  // header: 1 → mảng-mảng để lấy header riêng
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  if (aoa.length === 0) return { headers: [], rows: [] };

  const headers = (aoa[0] as unknown[]).map((h) => String(h ?? "").trim()).filter(Boolean);
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const r = aoa[i] as unknown[];
    if (!r || r.every((v) => v === "" || v == null)) continue;
    const rec: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      rec[h] = r[idx] ?? "";
    });
    rows.push(rec);
  }

  return { headers, rows };
}

/** Tạo file Excel (xlsx) từ mảng object → trigger download. */
export function exportToExcel<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: string; header: string }[],
  filename: string,
) {
  const aoa: unknown[][] = [];
  aoa.push(columns.map((c) => c.header));
  for (const r of rows) {
    aoa.push(columns.map((c) => formatCell(r[c.key])));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, ensureExt(filename, ".xlsx"));
}

/** Tạo file CSV từ mảng object → trigger download (UTF-8 BOM cho Excel VN). */
export function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: string; header: string }[],
  filename: string,
) {
  const lines = [columns.map((c) => csvField(c.header)).join(",")];
  for (const r of rows) {
    lines.push(columns.map((c) => csvField(formatCell(r[c.key]))).join(","));
  }
  const csv = "﻿" + lines.join("\r\n"); // BOM để Excel mở UTF-8 đúng
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, ensureExt(filename, ".csv"));
}

/** Tạo template trống để user tải về điền (chỉ có header). */
export function downloadTemplate(columns: { key: string; header: string }[], filename: string, sample?: Record<string, unknown>) {
  const rows: Record<string, unknown>[] = [];
  if (sample) rows.push(sample);
  exportToExcel(rows, columns, filename);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCell(v: unknown): string | number {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function csvField(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ensureExt(name: string, ext: string): string {
  return name.toLowerCase().endsWith(ext) ? name : name + ext;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
