"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addApprovalStep,
  bulkApproveRequests,
  commentApproval,
  createApprovalRequest,
  delegateApproval,
  reassignApproval,
  resolveAlert,
  setApprovalStatus,
  returnApproval,
} from "@/lib/repositories/governance";

export async function resolveAlertAction(formData: FormData) {
  const alertId = String(formData.get("alertId") ?? "");
  if (!alertId) return;
  await resolveAlert(alertId);
  revalidatePath("/alerts");
}

async function serializeApprovalFormEntry(entry: FormDataEntryValue) {
  if (entry instanceof File) {
    if (!entry.name || entry.size === 0) return "";
    const shouldEmbed = entry.size <= 2_000_000 && (entry.type.startsWith("image/") || entry.type === "application/pdf");
    const dataUrl = shouldEmbed
      ? `data:${entry.type || "application/octet-stream"};base64,${Buffer.from(await entry.arrayBuffer()).toString("base64")}`
      : undefined;
    return {
      kind: "file",
      name: entry.name,
      size: entry.size,
      type: entry.type || "application/octet-stream",
      dataUrl,
    };
  }
  return String(entry);
}

async function serializeApprovalFormValue(entries: FormDataEntryValue[]) {
  const values = (await Promise.all(entries.map(serializeApprovalFormEntry))).filter((value) => value !== "");
  if (values.length > 1) return values;
  return values[0] ?? "";
}

function numberFromApprovalValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function evaluateApprovalFormula(formula: string, valuesByFieldId: Map<string, unknown>) {
  if (!formula.trim()) return "";
  const expression = formula.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, fieldId: string) =>
    String(numberFromApprovalValue(valuesByFieldId.get(fieldId.trim()))),
  );
  if (!/^[\d+\-*/().\s]+$/.test(expression)) return "";
  try {
    const result = Function(`"use strict"; return (${expression});`)() as unknown;
    return typeof result === "number" && Number.isFinite(result) ? result : "";
  } catch {
    return "";
  }
}

export async function createApprovalRequestAction(formData: FormData) {
  const kind = String(formData.get("kind") ?? "project_budget");
  const title = String(formData.get("title") ?? "");
  const requestedBy = String(formData.get("requestedBy") ?? "") || null;
  const amount = Number(formData.get("amount") ?? 0);
  const headcount = Number(formData.get("headcount") ?? 0);
  const note = String(formData.get("note") ?? "");
  const flowStepLabels = formData.getAll("flowStepLabel").map(String);
  const flowStepApproverIds = formData.getAll("flowStepApproverId").map(String);
  const flowStepRoles = formData.getAll("flowStepRole").map(String);
  const designedFieldIds = formData.getAll("designedFieldId").map(String);
  const designedFieldLabels = formData.getAll("designedFieldLabel").map(String);
  const designedFieldTypes = formData.getAll("designedFieldType").map(String);
  const designedFieldFormulas = formData.getAll("designedFieldFormula").map(String);
  const rawDesignedFormData = await Promise.all(
    designedFieldIds.map(async (fieldId, index) => ({
      fieldId,
      label: designedFieldLabels[index] || fieldId,
      type: designedFieldTypes[index] || "input",
      formula: designedFieldFormulas[index] || "",
      value: await serializeApprovalFormValue(formData.getAll(`formField:${fieldId}`)),
    })),
  );
  const valuesByFieldId = new Map(rawDesignedFormData.map((field) => [field.fieldId, field.value]));
  const designedFormData = rawDesignedFormData.map((field) => ({
    fieldId: field.fieldId,
    label: field.label,
    value: field.type === "formula" ? evaluateApprovalFormula(field.formula, valuesByFieldId) : field.value,
  }));
  const payload: Record<string, unknown> = {
    note,
    formData: designedFormData,
  };

  if (kind === "payroll_adjustment") {
    payload.amount = Number.isFinite(amount) ? amount : 0;
    payload.reason = note || "Điều chỉnh payroll test";
  } else if (kind === "job_requisition") {
    payload.headcount = Number.isFinite(headcount) && headcount > 0 ? headcount : 1;
    payload.position = title || "Vị trí test";
  } else if (kind === "kpi_change") {
    payload.kpi = "MKT.LEADS";
    payload.new_target = Number.isFinite(amount) && amount > 0 ? amount : 600;
    payload.reason = note || "Điều chỉnh target KPI test";
  } else if (kind === "project_budget") {
    payload.project = "pj1";
    payload.new_budget = Number.isFinite(amount) ? amount : 0;
    payload.reason = note || "Tăng budget dự án test";
  }

  const created = await createApprovalRequest({
    kind,
    title: title || "Request phê duyệt test",
    payload,
    requestedBy,
    workflowSteps: flowStepLabels.map((label, index) => ({
      label,
      approverEmployeeId: flowStepApproverIds[index] || null,
      approverRole: flowStepRoles[index] || "manual",
    })),
  });
  revalidatePath("/approvals");
  revalidatePath("/approval");
  revalidatePath("/approval/inbox");
  revalidatePath("/approval/data");
  revalidatePath("/approval/analytics");
  if (created?.id) redirect(`/approval/requests/${created.id}`);
}

export async function approveRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  if (!approvalId) return;
  await setApprovalStatus(approvalId, "approved", String(formData.get("note") ?? ""));
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath(`/approval/requests/${approvalId}`);
  revalidatePath("/approval/data");
  revalidatePath("/approval/analytics");
}

export async function rejectRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  if (!approvalId) return;
  await setApprovalStatus(approvalId, "rejected", String(formData.get("note") ?? ""));
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath(`/approval/requests/${approvalId}`);
  revalidatePath("/approval/data");
  revalidatePath("/approval/analytics");
}

export async function bulkApproveRequestsAction(formData: FormData) {
  const ids = formData.getAll("approvalIds").map(String).filter(Boolean);
  await bulkApproveRequests(ids, String(formData.get("note") ?? ""));
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath("/approval/data");
  revalidatePath("/approval/analytics");
}

export async function reassignApprovalAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  const toEmployeeId = String(formData.get("toEmployeeId") ?? "");
  if (!approvalId || !toEmployeeId) return;
  await reassignApproval(approvalId, toEmployeeId, String(formData.get("note") ?? ""));
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath(`/approval/requests/${approvalId}`);
}

export async function delegateApprovalAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  const toEmployeeId = String(formData.get("toEmployeeId") ?? "");
  if (!approvalId || !toEmployeeId) return;
  await delegateApproval(approvalId, toEmployeeId, String(formData.get("note") ?? ""));
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath(`/approval/requests/${approvalId}`);
}

export async function returnApprovalAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  if (!approvalId) return;
  await returnApproval(approvalId, String(formData.get("note") ?? ""));
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath(`/approval/requests/${approvalId}`);
}

export async function addApprovalStepAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  const toEmployeeId = String(formData.get("toEmployeeId") ?? "");
  const position = String(formData.get("position") ?? "after_current") === "before_current" ? "before_current" : "after_current";
  if (!approvalId || !toEmployeeId) return;
  await addApprovalStep(approvalId, toEmployeeId, position, String(formData.get("note") ?? ""));
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath(`/approval/requests/${approvalId}`);
}

export async function commentApprovalAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!approvalId || !note.trim()) return;
  await commentApproval(approvalId, note);
  revalidatePath("/approvals");
  revalidatePath("/approval/inbox");
  revalidatePath(`/approval/requests/${approvalId}`);
  redirect(`/approval/requests/${approvalId}`);
}
