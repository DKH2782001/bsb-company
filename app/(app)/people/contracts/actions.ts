"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createEmployeeDocument,
  deleteEmployeeDependent,
  deleteEmployeeDocument,
  saveContractAmendment,
  saveEmployeeDependent,
  saveEmploymentContract,
} from "@/lib/repositories/contracts";
import {
  contractAmendmentUpsertSchema,
  contractUpsertSchema,
  employeeDependentUpsertSchema,
  employeeDocumentCreateSchema,
  type ContractAmendmentUpsertInput,
  type ContractUpsertInput,
  type EmployeeDependentUpsertInput,
  type EmployeeDocumentCreateInput,
} from "@/lib/validation/schemas";
import { actionErr, actionOk, zodToFieldErrors, type ActionResult } from "@/lib/actions/result";

function validationError(err: unknown) {
  if (err instanceof ZodError) {
    return actionErr("Dữ liệu không hợp lệ", zodToFieldErrors(err));
  }
  return actionErr("Dữ liệu không hợp lệ");
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function repoErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return fallback;
}

function refreshContractsPaths() {
  revalidatePath("/people/contracts");
  revalidatePath("/people");
}

export async function upsertContractAction(
  raw: ContractUpsertInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed: ContractUpsertInput;
  try {
    parsed = contractUpsertSchema.parse(raw);
  } catch (err) {
    return validationError(err);
  }

  try {
    const id = await saveEmploymentContract(parsed);
    refreshContractsPaths();
    return actionOk({ id }, parsed.id ? "Đã cập nhật hợp đồng." : "Đã tạo hợp đồng.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể lưu hợp đồng."));
  }
}

export async function createContractAmendmentAction(
  raw: ContractAmendmentUpsertInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed: ContractAmendmentUpsertInput;
  try {
    parsed = contractAmendmentUpsertSchema.parse(raw);
  } catch (err) {
    return validationError(err);
  }

  try {
    const id = await saveContractAmendment(parsed);
    refreshContractsPaths();
    return actionOk({ id }, "Đã thêm phụ lục.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể tạo phụ lục."));
  }
}

export async function createEmployeeDocumentAction(
  raw: EmployeeDocumentCreateInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed: EmployeeDocumentCreateInput;
  try {
    parsed = employeeDocumentCreateSchema.parse(raw);
  } catch (err) {
    return validationError(err);
  }

  try {
    const id = await createEmployeeDocument(parsed);
    refreshContractsPaths();
    return actionOk({ id }, "Đã lưu hồ sơ.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể lưu hồ sơ."));
  }
}

export async function deleteEmployeeDocumentAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID hồ sơ");
  try {
    await deleteEmployeeDocument(id);
    refreshContractsPaths();
    return actionOk(undefined, "Đã xoá hồ sơ.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể xoá hồ sơ."));
  }
}

export async function upsertEmployeeDependentAction(
  raw: EmployeeDependentUpsertInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed: EmployeeDependentUpsertInput;
  try {
    parsed = employeeDependentUpsertSchema.parse(raw);
  } catch (err) {
    return validationError(err);
  }

  try {
    const id = await saveEmployeeDependent(parsed);
    refreshContractsPaths();
    return actionOk({ id }, parsed.id ? "Đã cập nhật người phụ thuộc." : "Đã thêm người phụ thuộc.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể lưu người phụ thuộc."));
  }
}

export async function deleteEmployeeDependentAction(id: string): Promise<ActionResult> {
  if (!id) return actionErr("Thiếu ID người phụ thuộc");
  try {
    await deleteEmployeeDependent(id);
    refreshContractsPaths();
    return actionOk(undefined, "Đã xoá người phụ thuộc.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể xoá người phụ thuộc."));
  }
}
