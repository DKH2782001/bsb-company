"use server";

import { queryAuditLogs, type AuditLogFilter } from "@/lib/repositories/governance";

/** Escape CSV field: bọc dấu nháy nếu có dấu phẩy / nháy / xuống dòng. */
function csvField(value: unknown): string {
  if (value == null) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Gọi từ form (export button). Trả CSV string để client tải xuống. */
export async function exportAuditLogsAction(filter: AuditLogFilter): Promise<{ csv: string; filename: string }> {
  // Lấy tối đa 5000 bản ghi (đã filter) cho 1 lần export
  const { rows } = await queryAuditLogs({ ...filter, page: 1, pageSize: 5000 });

  const header = ["created_at", "actor", "action", "entity", "entity_id", "ip_address", "user_agent", "before", "after"];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push([
      csvField(r.created_at),
      csvField(r.actor),
      csvField(r.action),
      csvField(r.entity),
      csvField(r.entity_id),
      csvField(r.ip_address),
      csvField(r.user_agent),
      csvField(r.before),
      csvField(r.after),
    ].join(","));
  }

  const csv = lines.join("\r\n");
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return { csv, filename: `audit_logs_${ts}.csv` };
}
