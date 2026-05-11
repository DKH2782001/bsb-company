import Link from "next/link";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tServer } from "@/lib/i18n/server";
import { isDemoMode } from "@/lib/env";

const DEMO_ACCOUNTS = [
  { email: "ceo@bizos.demo", role: "CEO", color: "from-indigo-500 to-purple-600", desc: "Full access" },
  { email: "cfo@bizos.demo", role: "CFO", color: "from-emerald-500 to-teal-600", desc: "Tài chính" },
  { email: "hr@bizos.demo", role: "HR Admin", color: "from-pink-500 to-rose-600", desc: "Nhân sự" },
  { email: "sales.head@bizos.demo", role: "Trưởng phòng", color: "from-amber-500 to-orange-600", desc: "Sales" },
  { email: "nhanvien@bizos.demo", role: "Nhân viên", color: "from-sky-500 to-blue-600", desc: "Quyền cơ bản" },
  { email: "auditor@bizos.demo", role: "Kiểm toán", color: "from-slate-500 to-gray-600", desc: "Read-only" },
];

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
        <p className="mt-1 text-sm text-[var(--text-soft)]">{t("auth.welcome")}</p>
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
        <div className="space-y-3 rounded-lg border border-[var(--info-border)] bg-[var(--info-bg)] p-3 text-sm text-[var(--info-text)]">
          <div>Demo mode dang bat. Khong can dang nhap Supabase, co the vao thang dashboard de test.</div>
          <Link
            href="/dashboard"
            className="flex h-11 w-full items-center justify-center rounded-2xl bg-[var(--brand-600)] px-4 text-sm font-semibold text-white shadow-sm"
          >
            Vao dashboard demo
          </Link>
        </div>
      )}

      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.labelEmail")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            defaultValue={demoMode ? "ceo@bizos.demo" : ""}
            required={!demoMode}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.labelPassword")}</Label>
            <Link href="/reset-password" className="text-xs text-[var(--brand-600)] hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            defaultValue={demoMode ? "demo123456" : ""}
            required={!demoMode}
          />
        </div>
        <Button type="submit" className="w-full">
          {demoMode ? "Vao demo" : t("common.login")}
        </Button>
      </form>

      {/* Quick login by role */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[var(--line-soft)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--surface)] px-2 text-[var(--text-soft)]">Đăng nhập nhanh theo vai trò</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <form key={acc.email} action={login}>
              <input type="hidden" name="email" value={acc.email} />
              <input type="hidden" name="password" value="demo123456" />
              <input type="hidden" name="next" value={next ?? "/dashboard"} />
              <button
                type="submit"
                className={`w-full rounded-xl bg-gradient-to-r ${acc.color} px-3 py-2.5 text-left text-white shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="text-sm font-semibold">{acc.role}</div>
                <div className="text-[11px] opacity-80">{acc.desc}</div>
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-[var(--text-soft)]">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-[var(--brand-600)] hover:underline">
          {t("common.signup")}
        </Link>
      </div>
    </div>
  );
}
