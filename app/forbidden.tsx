import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="mx-auto max-w-md text-center space-y-6 p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-strong)]">403 — Không có quyền</h1>
          <p className="mt-2 text-[var(--text-soft)]">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--brand-600)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-700)] transition-colors"
          >
            Về Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--line-soft)] px-6 text-sm font-medium text-[var(--text-soft)] hover:bg-[var(--surface-alt)] transition-colors"
          >
            Đăng nhập tài khoản khác
          </Link>
        </div>
      </div>
    </div>
  );
}
