"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateVN } from "@/lib/utils";

type ActivityItem = {
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
};

const activityTypeIcons: Record<string, { icon: string; color: string }> = {
  "Cập nhật": { icon: "✏️", color: "bg-blue-100 dark:bg-blue-900/30" },
  "Đổi mật": { icon: "🔑", color: "bg-amber-100 dark:bg-amber-900/30" },
  "Bật": { icon: "🛡️", color: "bg-emerald-100 dark:bg-emerald-900/30" },
  "Đăng nhập": { icon: "🔓", color: "bg-indigo-100 dark:bg-indigo-900/30" },
  "Phê duyệt": { icon: "✅", color: "bg-green-100 dark:bg-green-900/30" },
};

function getActivityMeta(title: string) {
  for (const [key, meta] of Object.entries(activityTypeIcons)) {
    if (title.includes(key)) return meta;
  }
  return { icon: "📋", color: "bg-[var(--surface-alt)]" };
}

export function ActivityFullDialog({
  activities,
}: {
  activities: ActivityItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--brand-600)] cursor-pointer hover:text-[var(--brand-700)] transition-colors"
      >
        Xem tất cả
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--brand-600)]" />
            Hoạt động gần đây
          </div>
        }
        description="Lịch sử hoạt động tài khoản của bạn trong 30 ngày gần đây."
        size="md"
        footer={
          <Button onClick={() => setOpen(false)}>Đóng</Button>
        }
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {activities.length === 0 && (
            <div className="text-center text-sm text-[var(--text-soft)] py-8">
              Không có hoạt động nào.
            </div>
          )}
          {activities.map((item, index) => {
            const meta = getActivityMeta(item.title);
            return (
              <div
                key={`${item.title}-${item.created_at}-${index}`}
                className="flex gap-3 rounded-2xl border border-[var(--line-soft)] p-3 hover:bg-[var(--surface-alt)] transition-colors"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.color} text-sm shrink-0`}>
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--text-strong)]">{item.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-soft)]">
                    {formatDateVN(item.created_at)}
                  </div>
                  {item.body && (
                    <div className="mt-1 text-xs text-[var(--text-soft)]">{item.body}</div>
                  )}
                </div>
                {item.link && (
                  <a
                    href={item.link}
                    className="self-center text-xs font-medium text-[var(--brand-600)] hover:underline"
                  >
                    Xem
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}
