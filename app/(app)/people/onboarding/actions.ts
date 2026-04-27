"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createOnboardingRun,
  updateOnboardingRunTask,
} from "@/lib/repositories/onboarding";
import {
  onboardingRunCreateSchema,
  onboardingTaskUpdateSchema,
  type OnboardingRunCreateInput,
  type OnboardingTaskUpdateInput,
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

function refreshOnboardingPaths() {
  revalidatePath("/people/onboarding");
  revalidatePath("/people");
}

export async function createOnboardingRunAction(
  raw: OnboardingRunCreateInput,
): Promise<ActionResult<{ id?: string }>> {
  let parsed: OnboardingRunCreateInput;
  try {
    parsed = onboardingRunCreateSchema.parse(raw);
  } catch (err) {
    return validationError(err);
  }

  try {
    const id = await createOnboardingRun(parsed);
    refreshOnboardingPaths();
    return actionOk({ id }, "Đã tạo checklist.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể tạo checklist."));
  }
}

export async function updateOnboardingTaskAction(
  raw: OnboardingTaskUpdateInput,
): Promise<ActionResult> {
  let parsed: OnboardingTaskUpdateInput;
  try {
    parsed = onboardingTaskUpdateSchema.parse(raw);
  } catch (err) {
    return validationError(err);
  }

  try {
    await updateOnboardingRunTask(parsed);
    refreshOnboardingPaths();
    return actionOk(undefined, "Đã cập nhật task.");
  } catch (err) {
    return actionErr(repoErrorMessage(err, "Không thể cập nhật task."));
  }
}
