import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Approval } from "@/types/domain";

const STORE_FILE = ".bizos-demo-approvals.json";

function storePath() {
  return path.join(process.cwd(), STORE_FILE);
}

export async function readStoredDemoApprovals(): Promise<Approval[]> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Approval[]) : [];
  } catch {
    return [];
  }
}

export async function writeStoredDemoApprovals(approvals: Approval[]) {
  await writeFile(storePath(), `${JSON.stringify(approvals, null, 2)}\n`, "utf8");
}

export async function listDemoApprovals(seed: Approval[]) {
  const stored = await readStoredDemoApprovals();
  const seen = new Set<string>();
  return [...stored, ...seed]
    .filter((approval) => {
      if (seen.has(approval.id)) return false;
      seen.add(approval.id);
      return true;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function prependStoredDemoApproval(approval: Approval) {
  const stored = await readStoredDemoApprovals();
  await writeStoredDemoApprovals([approval, ...stored.filter((item) => item.id !== approval.id)]);
}

export async function upsertStoredDemoApproval(approval: Approval) {
  const stored = await readStoredDemoApprovals();
  const index = stored.findIndex((item) => item.id === approval.id);
  if (index >= 0) {
    stored[index] = approval;
    await writeStoredDemoApprovals(stored);
    return;
  }
  await writeStoredDemoApprovals([approval, ...stored]);
}
