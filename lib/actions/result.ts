export type ActionOk<T = void> = {
  ok: true;
  data?: T;
  message?: string;
};

export type ActionErr = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T = void> = ActionOk<T> | ActionErr;

export function actionOk<T = void>(data?: T, message?: string): ActionOk<T> {
  return { ok: true, data, message };
}

export function actionErr(error: string, fieldErrors?: Record<string, string[]>): ActionErr {
  return { ok: false, error, fieldErrors };
}

import { ZodError } from "zod";

export function zodToFieldErrors(err: ZodError): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    (map[path] ||= []).push(issue.message);
  }
  return map;
}
