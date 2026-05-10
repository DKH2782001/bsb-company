import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { defaultApprovalTemplateDraft, type ApprovalTemplateDraft } from "@/lib/approvals/templateSchema";

const STORE_FILE = ".bizos-approval-templates.json";

function storePath() {
  return path.join(process.cwd(), STORE_FILE);
}

function defaultPublishedTemplate(): ApprovalTemplateDraft {
  return {
    ...defaultApprovalTemplateDraft,
    status: "published",
  };
}

async function readStoredTemplates(): Promise<ApprovalTemplateDraft[]> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ApprovalTemplateDraft[]) : [];
  } catch {
    return [];
  }
}

async function writeStoredTemplates(templates: ApprovalTemplateDraft[]) {
  await writeFile(storePath(), `${JSON.stringify(templates, null, 2)}\n`, "utf8");
}

export async function listApprovalTemplatesForAdmin(): Promise<ApprovalTemplateDraft[]> {
  const stored = await readStoredTemplates();
  const storedIds = new Set(stored.map((template) => template.id));
  const defaults = storedIds.has(defaultApprovalTemplateDraft.id) ? [] : [defaultPublishedTemplate()];
  return [...stored, ...defaults];
}

export async function listApprovalTemplates(): Promise<ApprovalTemplateDraft[]> {
  const templates = await listApprovalTemplatesForAdmin();
  return templates.filter((template) => template.status === "published");
}

export async function getApprovalTemplate(templateId: string): Promise<ApprovalTemplateDraft | null> {
  const templates = await listApprovalTemplatesForAdmin();
  return templates.find((template) => template.id === templateId) ?? null;
}

export async function upsertApprovalTemplate(template: ApprovalTemplateDraft): Promise<ApprovalTemplateDraft> {
  const normalized: ApprovalTemplateDraft = {
    ...template,
    id: template.id || `template_${Date.now()}`,
    status: "published",
  };
  const stored = await readStoredTemplates();
  const next = [normalized, ...stored.filter((item) => item.id !== normalized.id)];
  await writeStoredTemplates(next);
  return normalized;
}

export async function archiveApprovalTemplate(templateId: string): Promise<ApprovalTemplateDraft | null> {
  const existing = (await getApprovalTemplate(templateId)) ?? null;
  if (!existing) return null;
  const archived: ApprovalTemplateDraft = { ...existing, status: "archived" };
  const stored = await readStoredTemplates();
  await writeStoredTemplates([archived, ...stored.filter((item) => item.id !== templateId)]);
  return archived;
}

export async function restoreApprovalTemplate(templateId: string): Promise<ApprovalTemplateDraft | null> {
  const existing = (await getApprovalTemplate(templateId)) ?? null;
  if (!existing) return null;
  return upsertApprovalTemplate({ ...existing, status: "published" });
}

export async function duplicateApprovalTemplate(templateId: string): Promise<ApprovalTemplateDraft | null> {
  const existing = (await getApprovalTemplate(templateId)) ?? null;
  if (!existing) return null;
  const copy: ApprovalTemplateDraft = {
    ...existing,
    id: `template_${Date.now()}`,
    status: "draft",
    basicInfo: {
      ...existing.basicInfo,
      name: `${existing.basicInfo.name} - Copy`,
    },
  };
  const stored = await readStoredTemplates();
  await writeStoredTemplates([copy, ...stored]);
  return copy;
}
