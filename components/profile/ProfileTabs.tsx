"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = ["Hồ sơ cơ bản", "Liên hệ", "Chữ ký điện tử"] as const;

export function ProfileTabs({
  basicTab,
  contactData,
  signatureData,
}: {
  basicTab: ReactNode;
  contactData: {
    personalEmail: string;
    phone: string;
    workPhone: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  signatureData: {
    fullName: string;
    position: string;
    email: string;
  };
}) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <div className="mb-5 flex items-center gap-4 border-b border-[var(--line-soft)] text-sm">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(index)}
            className={cn(
              "border-b-2 pb-3 font-medium transition-colors cursor-pointer",
              index === activeTab
                ? "border-[var(--brand-600)] font-semibold text-[var(--brand-700)]"
                : "border-transparent text-[var(--text-soft)] hover:text-[var(--text-strong)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && basicTab}

      {activeTab === 1 && (
        <div className="grid gap-3 animate-in fade-in-0 duration-200">
          <ContactField label="Email cá nhân" value={contactData.personalEmail} />
          <ContactField label="Số điện thoại" value={contactData.phone} />
          <ContactField label="Số điện thoại công việc" value={contactData.workPhone || "Chưa cập nhật"} />
          <ContactField label="Địa chỉ" value={contactData.address || "Chưa cập nhật"} />
          <div className="mt-2 rounded-2xl bg-[var(--surface-alt)] p-4">
            <div className="text-xs font-semibold text-[var(--text-strong)] mb-3">Liên hệ khẩn cấp</div>
            <div className="grid gap-2">
              <ContactField label="Người liên hệ" value={contactData.emergencyContact || "Chưa cập nhật"} />
              <ContactField label="Số điện thoại" value={contactData.emergencyPhone || "Chưa cập nhật"} />
            </div>
          </div>
          <p className="text-xs text-[var(--text-soft)] mt-1">
            Để cập nhật thông tin liên hệ, vui lòng liên hệ phòng Nhân sự.
          </p>
        </div>
      )}

      {activeTab === 2 && (
        <div className="animate-in fade-in-0 duration-200">
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-50)]">
              <svg className="h-7 w-7 text-[var(--brand-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-[var(--text-strong)] mb-1">Chữ ký điện tử</div>
            <p className="text-xs text-[var(--text-soft)] mb-4 max-w-xs mx-auto">
              Tạo chữ ký điện tử để sử dụng trong email, hợp đồng và tài liệu nội bộ.
            </p>

            <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-[var(--line-soft)] bg-white dark:bg-[var(--surface)] p-5 mb-4">
              <div className="font-serif text-lg italic text-[var(--brand-700)]">{signatureData.fullName}</div>
              <div className="mt-1 text-xs text-[var(--text-soft)]">{signatureData.position}</div>
              <div className="text-xs text-[var(--text-soft)]">{signatureData.email}</div>
              <div className="mt-2 h-px bg-[var(--line-soft)]" />
              <div className="mt-2 text-[10px] text-[var(--text-soft)]">BIZOS Company OS</div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-600)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-700)] transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Chỉnh sửa chữ ký
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line-soft)] bg-white dark:bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-strong)] hover:bg-[var(--surface-alt)] transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Sao chép
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ContactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <div className="flex min-h-11 items-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] px-3.5 text-sm text-[var(--text-strong)]">
        {value}
      </div>
    </div>
  );
}
