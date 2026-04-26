"use client";

import { useState, useTransition } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordDialog({
  hasSupabaseEnv,
}: {
  hasSupabaseEnv: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function handleSubmit() {
    setError(null);

    if (!currentPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!hasSupabaseEnv) {
      toast({ variant: "success", title: "Đã cập nhật mật khẩu", description: "(Demo mode)" });
      handleClose();
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          setError(updateError.message);
          return;
        }

        toast({ variant: "success", title: "Đã cập nhật mật khẩu", description: "Mật khẩu của bạn đã được thay đổi thành công." });
        handleClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      }
    });
  }

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] cursor-pointer hover:text-[var(--brand-700)] transition-colors"
      >
        <span>Cập nhật</span>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--brand-600)]" />
            Đổi mật khẩu
          </div>
        }
        description="Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số."
        footer={
          <>
            <Button variant="outline" onClick={handleClose}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <PasswordField
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent(!showCurrent)}
            placeholder="Nhập mật khẩu hiện tại"
          />

          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew(!showNew)}
            placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
          />

          {newPassword.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.level
                          ? passwordStrength.color
                          : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-medium ${passwordStrength.textColor}`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          <PasswordField
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm(!showConfirm)}
            placeholder="Nhập lại mật khẩu mới"
          />

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] hover:text-[var(--text-strong)] transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return { level: 0, label: "", color: "", textColor: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const map = [
    { level: 1, label: "Yếu", color: "bg-red-500", textColor: "text-red-500" },
    { level: 2, label: "Trung bình", color: "bg-amber-500", textColor: "text-amber-500" },
    { level: 3, label: "Khá", color: "bg-blue-500", textColor: "text-blue-500" },
    { level: 4, label: "Mạnh", color: "bg-emerald-500", textColor: "text-emerald-500" },
  ];

  return map[Math.min(score, 4) - 1] ?? map[0];
}
