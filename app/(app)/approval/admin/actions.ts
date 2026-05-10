"use server";

import { revalidatePath } from "next/cache";

import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import type { ApprovalTemplateDraft } from "@/lib/approvals/templateSchema";
import { validateApprovalTemplateDraft } from "@/lib/approvals/templateValidation";
import {
  archiveApprovalTemplate,
  duplicateApprovalTemplate,
  restoreApprovalTemplate,
  upsertApprovalTemplate,
} from "@/lib/repositories/approval-template-store";

function revalidateApprovalTemplatePages() {
  revalidatePath("/approval");
  revalidatePath("/approval/admin");
  revalidatePath("/approval/admin/createApproval");
}

export async function publishApprovalTemplateAction(
  template: ApprovalTemplateDraft,
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const normalized: ApprovalTemplateDraft = {
      ...template,
      status: "published",
      basicInfo: {
        ...template.basicInfo,
        name: template.basicInfo.name.trim(),
        group: template.basicInfo.group.trim(),
      },
    };

    const validation = validateApprovalTemplateDraft(normalized);
    if (!validation.ok) return actionErr(validation.error);

    const saved = await upsertApprovalTemplate(normalized);
    revalidateApprovalTemplatePages();

    return actionOk({ id: saved.id, name: saved.basicInfo.name }, "Da publish mau phe duyet.");
  } catch (error) {
    return actionErr(error instanceof Error ? error.message : "Khong the publish mau phe duyet.");
  }
}

export async function archiveApprovalTemplateAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;
  await archiveApprovalTemplate(templateId);
  revalidateApprovalTemplatePages();
}

export async function restoreApprovalTemplateAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;
  await restoreApprovalTemplate(templateId);
  revalidateApprovalTemplatePages();
}

export async function duplicateApprovalTemplateAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;
  await duplicateApprovalTemplate(templateId);
  revalidatePath("/approval/admin");
}
