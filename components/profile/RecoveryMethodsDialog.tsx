"use client";

import { useState } from "react";
import { Mail, Phone, Shield } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RecoveryMethod = {
  id: string;
  type: "email" | "phone";
  value: string;
  verified: boolean;
  isPrimary: boolean;
};

const defaultMethods: RecoveryMethod[] = [
  { id: "r1", type: "email", value: "ceo@bizos.demo", verified: true, isPrimary: true },
  { id: "r2", type: "email", value: "personal@gmail.com", verified: true, isPrimary: false },
  { id: "r3", type: "phone", value: "0943 494 158", verified: false, isPrimary: false },
];

export function RecoveryMethodsDialog() {
  const [open, setOpen] = useState(false);
  const [methods] = useState<RecoveryMethod[]>(defaultMethods);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] cursor-pointer hover:text-[var(--brand-700)] transition-colors"
      >
        <span>Xem</span>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--brand-600)]" />
            Phương thức khôi phục
          </div>
        }
        description="Các phương thức khôi phục tài khoản khi quên mật khẩu hoặc mất quyền truy cập."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Đóng</Button>
            <Button>
              <Mail className="h-3.5 w-3.5" />
              Thêm phương thức
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line-soft)] p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--brand-600)]">
                {method.type === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-[var(--text-strong)]">
                    {method.type === "email" ? "Email" : "Số điện thoại"}
                  </div>
                  {method.isPrimary && <Badge variant="info">Chính</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-soft)]">{method.value}</div>
              </div>
              <Badge variant={method.verified ? "success" : "warning"}>
                {method.verified ? "Đã xác minh" : "Chưa xác minh"}
              </Badge>
            </div>
          ))}

          <div className="rounded-2xl bg-[var(--surface-alt)] p-3 text-xs text-[var(--text-soft)]">
            <strong>Lưu ý:</strong> Khuyến nghị thiết lập ít nhất 2 phương thức khôi phục (email + SĐT) để đảm bảo bạn luôn có thể truy cập tài khoản.
          </div>
        </div>
      </Dialog>
    </>
  );
}
