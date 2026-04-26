"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useTransition } from "react";
import { Shield, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatDateVN } from "@/lib/utils";

type MfaFactor = {
  id: string;
  friendly_name?: string;
  created_at?: string;
  updated_at?: string;
  last_challenged_at?: string;
};

type MfaState = {
  factors: MfaFactor[];
  currentLevel: string | null;
  nextLevel: string | null;
};

type PendingEnrollment = {
  factorId: string;
  challengeId: string;
  qrCode: string;
  secret: string;
};

async function readMfaState(enabled: boolean): Promise<MfaState> {
  if (!enabled) return { factors: [], currentLevel: null, nextLevel: null };

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return { factors: [], currentLevel: null, nextLevel: null };

  const [factorsResult, aalResult] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (factorsResult.error) throw factorsResult.error;
  if (aalResult.error) throw aalResult.error;

  return {
    factors: factorsResult.data?.totp ?? [],
    currentLevel: aalResult.data?.currentLevel ?? null,
    nextLevel: aalResult.data?.nextLevel ?? null,
  };
}

function qrCodeToDataUri(value: string) {
  if (value.startsWith("data:")) return value;
  return `data:image/svg+xml;utf-8,${encodeURIComponent(value)}`;
}

export function ProfileMfaPanel({
  hasSupabaseEnv,
  initialEnabled,
}: {
  hasSupabaseEnv: boolean;
  initialEnabled: boolean;
}) {
  const { toast } = useToast();
  const [state, setState] = useState<MfaState>({
    factors: initialEnabled ? [{ id: "initial", friendly_name: "Authenticator app" }] : [],
    currentLevel: initialEnabled ? "aal2" : null,
    nextLevel: initialEnabled ? "aal2" : null,
  });
  const [pendingEnrollment, setPendingEnrollment] = useState<PendingEnrollment | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextState = await readMfaState(hasSupabaseEnv);
        if (active) setState(nextState);
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Không đọc được trạng thái MFA.");
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [hasSupabaseEnv]);

  async function refreshState() {
    const nextState = await readMfaState(hasSupabaseEnv);
    setState(nextState);
  }

  function startEnrollment() {
    setMessage(null);

    if (!hasSupabaseEnv) {
      setMessage("Cần cấu hình Supabase Auth và bật TOTP MFA trước khi enroll 2FA.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "BizOS Authenticator",
        issuer: "BizOS",
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const challenge = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challenge.error) {
        setMessage(challenge.error.message);
        return;
      }

      setPendingEnrollment({
        factorId: data.id,
        challengeId: challenge.data.id,
        qrCode: qrCodeToDataUri(data.totp.qr_code),
        secret: data.totp.secret,
      });
    });
  }

  function verifyEnrollment() {
    setMessage(null);

    if (!pendingEnrollment) return;
    if (!verificationCode.trim()) {
      setMessage("Nhập mã 6 số từ ứng dụng Authenticator.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.verify({
        factorId: pendingEnrollment.factorId,
        challengeId: pendingEnrollment.challengeId,
        code: verificationCode.trim(),
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setPendingEnrollment(null);
      setVerificationCode("");
      await refreshState();
      toast({ variant: "success", title: "Đã bật 2FA", description: "Tài khoản đã được bảo vệ bằng TOTP." });
    });
  }

  function unenrollFactor(factorId: string) {
    setMessage(null);

    if (!hasSupabaseEnv || factorId === "initial") {
      setMessage("Cần Supabase Auth thật để tắt 2FA.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) {
        setMessage(error.message);
        return;
      }

      await refreshState();
      toast({ variant: "success", title: "Đã tắt factor 2FA" });
    });
  }

  const enabled = state.factors.length > 0;

  return (
    <div className="rounded-[20px] border border-[var(--line-soft)] bg-white px-4 py-3.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--brand-600)]">
          <Shield className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-[var(--text-strong)]">Xác thực 2 lớp (2FA)</div>
            <Badge variant={enabled ? "success" : "warning"}>{enabled ? "Đã bật" : "Chưa bật"}</Badge>
          </div>
          <div className="mt-0.5 text-xs text-[var(--text-soft)]">
            TOTP qua Google Authenticator, Authy hoặc 1Password. AAL hiện tại: {state.currentLevel ?? "n/a"}.
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {message}
        </div>
      )}

      {!hasSupabaseEnv && (
        <div className="mt-3 rounded-2xl bg-[var(--surface-alt)] p-3 text-xs text-[var(--text-soft)]">
          Cần `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và bật Supabase MFA TOTP để dùng thật.
        </div>
      )}

      {enabled && (
        <div className="mt-3 space-y-2">
          {state.factors.map((factor) => (
            <div key={factor.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-alt)] p-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--text-strong)]">
                  {factor.friendly_name ?? "Authenticator app"}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                  Bật từ {factor.created_at ? formatDateVN(factor.created_at) : "Supabase Auth"}
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => unenrollFactor(factor.id)}>
                <Trash2 className="h-3.5 w-3.5" />
                Tắt
              </Button>
            </div>
          ))}
        </div>
      )}

      {pendingEnrollment && (
        <div className="mt-3 space-y-3 rounded-2xl border border-[var(--line-soft)] p-3">
          <div className="grid gap-3 sm:grid-cols-[132px_1fr]">
            <img src={pendingEnrollment.qrCode} alt="Mã QR bật 2FA" className="h-32 w-32 rounded-xl border border-[var(--line-soft)] bg-white p-2" />
            <div className="min-w-0 text-xs text-[var(--text-soft)]">
              <div className="font-semibold text-[var(--text-strong)]">Quét QR bằng ứng dụng Authenticator</div>
              <div className="mt-2 break-all rounded-xl bg-[var(--surface-alt)] p-2 font-mono">{pendingEnrollment.secret}</div>
              <div className="mt-2">Sau khi quét, nhập mã 6 số để xác minh.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
            />
            <Button type="button" disabled={isPending} onClick={verifyEnrollment}>
              Xác minh
            </Button>
          </div>
        </div>
      )}

      {!pendingEnrollment && (
        <Button type="button" variant={enabled ? "outline" : "default"} size="sm" className="mt-3" disabled={isPending || !hasSupabaseEnv} onClick={startEnrollment}>
          {enabled ? "Thêm thiết bị 2FA" : "Bật 2FA"}
        </Button>
      )}
    </div>
  );
}
