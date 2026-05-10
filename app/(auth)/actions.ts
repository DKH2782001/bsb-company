"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { appEnv, isDemoMode } from "@/lib/env";
import { createClientOrNull, hasSupabaseEnv } from "@/lib/supabase/server";

function encodeError(err: string, path: string) {
  const url = new URL(path, "http://app");
  url.searchParams.set("error", err);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

const DEMO_MSG =
  "Demo mode: chưa cấu hình Supabase (.env.local). Anh có thể duyệt mọi trang bằng data mẫu.";

const DEMO_EMAIL = "ceo@bizos.demo";
const DEMO_PASSWORD = "demo123456";
const DEMO_LOGIN_ALIASES = [
  { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  { email: "ceo@bizos.local", password: "123456" },
];

function isDemoLogin(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  return DEMO_LOGIN_ALIASES.some(
    (credential) => credential.email === normalizedEmail && credential.password === password,
  );
}

async function setDemoSession() {
  const cookieStore = await cookies();
  cookieStore.set("bizos_demo_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete("bizos_demo_session");
}

export async function login(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv() || isDemoMode()) {
    redirect("/dashboard");
  }

  const rateLimit = await checkRateLimit({ key: "auth:login", limit: 8, windowMs: 5 * 60 * 1000 });
  if (!rateLimit.allowed) {
    redirect(encodeError(`Too many login attempts. Try again in ${rateLimit.retryAfterSeconds}s.`, "/login"));
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (isDemoLogin(email, password)) {
    await setDemoSession();
    redirect(next || "/dashboard");
  }

  const supabase = (await createClientOrNull())!;
  let error: { message: string } | null = null;
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    error = result.error;
  } catch (err) {
    if (DEMO_LOGIN_ALIASES.some((credential) => credential.email === email.toLowerCase())) {
      await setDemoSession();
      redirect(next || "/dashboard");
    }
    throw err;
  }

  if (error) {
    redirect(encodeError(error.message, "/login"));
  }

  redirect(next || "/dashboard");
}

export async function signup(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv() || isDemoMode()) {
    redirect("/dashboard");
  }

  const rateLimit = await checkRateLimit({ key: "auth:signup", limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rateLimit.allowed) {
    redirect(encodeError(`Too many signup attempts. Try again in ${rateLimit.retryAfterSeconds}s.`, "/signup"));
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");

  const supabase = (await createClientOrNull())!;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(encodeError(error.message, "/signup"));
  }

  redirect("/login?registered=1");
}

export async function logout(): Promise<void> {
  await clearDemoSession();
  const supabase = await createClientOrNull();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function sendReset(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv() || isDemoMode()) {
    redirect(encodeError(DEMO_MSG, "/reset-password"));
  }

  const rateLimit = await checkRateLimit({ key: "auth:reset", limit: 3, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    redirect(encodeError(`Too many reset requests. Try again in ${rateLimit.retryAfterSeconds}s.`, "/reset-password"));
  }

  const email = String(formData.get("email") ?? "");
  const supabase = (await createClientOrNull())!;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appEnv.appUrl}/update-password`,
  });
  if (error) {
    redirect(encodeError(error.message, "/reset-password"));
  }
  redirect("/reset-password?sent=1");
}
