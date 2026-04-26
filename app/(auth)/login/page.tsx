import Link from "next/link";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tServer } from "@/lib/i18n/server";
import { isDemoMode } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string; passwordUpdated?: string; error?: string }>;
}) {
  const { next, registered, passwordUpdated, error } = await searchParams;
  const { t } = await tServer();
  const demoMode = isDemoMode();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-strong)]">{t("common.login")}</h2>
        <p className="text-sm text-[var(--text-soft)] mt-1">{t("auth.welcome")}</p>
      </div>

      {registered && (
        <div className="rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm text-[var(--success-text)]">
          {t("auth.registered")}
        </div>
      )}
      {passwordUpdated && (
        <div className="rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm text-[var(--success-text)]">
          Password updated. Please sign in again.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-text)]">
          {error}
        </div>
      )}
      {demoMode && (
        <div className="rounded-lg border border-[var(--info-border)] bg-[var(--info-bg)] p-3 text-sm text-[var(--info-text)]">
          Demo mode đang bật. Không cần đăng nhập, anh có thể vào thẳng{" "}
          <Link href="/dashboard" className="font-medium underline">
            dashboard
          </Link>
          .
        </div>
      )}

      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.labelEmail")}</Label>
          <Input id="email" name="email" type="email" placeholder="you@company.com" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.labelPassword")}</Label>
            <Link href="/reset-password" className="text-xs text-[var(--brand-600)] hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          {t("common.login")}
        </Button>
      </form>

      <div className="text-center text-sm text-[var(--text-soft)]">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="text-[var(--brand-600)] font-medium hover:underline">
          {t("common.signup")}
        </Link>
      </div>
    </div>
  );
}
