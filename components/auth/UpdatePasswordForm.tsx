"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm({ hasSupabaseEnv }: { hasSupabaseEnv: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!hasSupabaseEnv) {
      setError("Chưa cấu hình Supabase Auth nên chưa thể cập nhật mật khẩu thật.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu cần tối thiểu 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Hãy gửi lại email reset.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut({ scope: "local" });
      toast({ variant: "success", title: "Đã cập nhật mật khẩu", description: "Hãy đăng nhập lại bằng mật khẩu mới." });
      router.replace("/login?passwordUpdated=1");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!hasSupabaseEnv && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Cần cấu hình Supabase Auth trước khi dùng reset password thật.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu mới</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="text-xs text-zinc-500">Tối thiểu 8 ký tự. Nên dùng chữ hoa, chữ thường và số.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !hasSupabaseEnv}>
        {isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
      </Button>
    </form>
  );
}
