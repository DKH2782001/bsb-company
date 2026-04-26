import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

export default function UpdatePasswordPage() {
  const canUseSupabaseAuth = hasSupabaseEnv() && !isDemoMode();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Đặt mật khẩu mới</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Mở trang này từ link reset trong email, sau đó nhập mật khẩu mới cho tài khoản.
        </p>
      </div>

      <UpdatePasswordForm hasSupabaseEnv={canUseSupabaseAuth} />

      <div className="text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
