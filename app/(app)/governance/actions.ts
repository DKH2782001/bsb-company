"use server";

import { revalidatePath } from "next/cache";
import { resolveAlert, setApprovalStatus } from "@/lib/repositories/governance";

export async function resolveAlertAction(formData: FormData) {
  const alertId = String(formData.get("alertId") ?? "");
  if (!alertId) return;
  await resolveAlert(alertId);
  revalidatePath("/alerts");
}

export async function approveRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  if (!approvalId) return;
  await setApprovalStatus(approvalId, "approved");
  revalidatePath("/approvals");
}

export async function rejectRequestAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  if (!approvalId) return;
  await setApprovalStatus(approvalId, "rejected");
  revalidatePath("/approvals");
}
