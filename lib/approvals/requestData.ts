import type { Approval } from "@/types/domain";

export type ApprovalFormDataRow = {
  fieldId: string;
  label: string;
  value: string;
};

export function formatApprovalPayloadValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.map(formatApprovalPayloadValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.kind === "file") {
      const size = typeof record.size === "number" ? ` (${Math.round(record.size / 1024)}KB)` : "";
      return `${String(record.name ?? "file")}${size}`;
    }
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function getApprovalFormDataRows(approval: Approval): ApprovalFormDataRow[] {
  const formData = approval.payload.formData;
  if (!Array.isArray(formData)) return [];

  return formData.map((item, index) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      fieldId: String(row.fieldId ?? `field_${index}`),
      label: String(row.label ?? row.fieldId ?? `Field ${index + 1}`),
      value: formatApprovalPayloadValue(row.value),
    };
  });
}

export function getApprovalValueByLabel(approval: Approval, label: string): string {
  return getApprovalFormDataRows(approval).find((row) => row.label === label)?.value ?? "";
}

export function getApprovalDataColumns(approvals: Approval[]) {
  const seen = new Set<string>();
  return approvals.flatMap(getApprovalFormDataRows).filter((row) => {
    if (seen.has(row.label)) return false;
    seen.add(row.label);
    return true;
  });
}

export function toCsvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}
