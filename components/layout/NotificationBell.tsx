"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  fetchMyNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/(app)/_actions/notifications";
import type { Notification } from "@/types/domain";

type Props = {
  initialItems: Notification[];
  initialUnread: number;
  authUserId: string | null;
  hasSupabase: boolean;
};

const POLL_INTERVAL_MS = 20_000;

export function NotificationBell({ initialItems, initialUnread, authUserId, hasSupabase }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>(initialItems);
  const [unread, setUnread] = useState<number>(initialUnread);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set(initialItems.map((n) => n.id)));

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Refresh từ server: dùng cho cả Realtime và polling fallback.
  // Khi có item mới (id chưa biết) → toast.
  function refresh(showToastForNew = true) {
    fetchMyNotificationsAction(20)
      .then(({ items: nextItems, unread: nextUnread }) => {
        if (showToastForNew) {
          for (const n of nextItems) {
            if (!knownIdsRef.current.has(n.id) && !n.read_at) {
              toast({ variant: "info", title: n.title, description: n.body ?? undefined });
            }
            knownIdsRef.current.add(n.id);
          }
        } else {
          for (const n of nextItems) knownIdsRef.current.add(n.id);
        }
        setItems(nextItems);
        setUnread(nextUnread);
      })
      .catch(() => {
        // im lặng — sẽ thử lại ở vòng poll sau
      });
  }

  // Realtime (production) hoặc polling (demo / no realtime)
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    if (hasSupabase && authUserId) {
      // Lazy-load supabase client để không bundle khi demo
      let cancelled = false;
      import("@/lib/supabase/client")
        .then(({ createClient }) => {
          if (cancelled) return;
          const supabase = createClient();
          if (!supabase) return;
          const channel = supabase
            .channel(`notifications:${authUserId}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `auth_user_id=eq.${authUserId}`,
              },
              () => refresh(true),
            )
            .subscribe();
          cleanup = () => {
            supabase.removeChannel(channel);
          };
        })
        .catch(() => {
          // Nếu lazy-load fail → fallback poll
          const t = setInterval(() => refresh(true), POLL_INTERVAL_MS);
          cleanup = () => clearInterval(t);
        });
      return () => {
        cancelled = true;
        cleanup?.();
      };
    }

    // Demo / no realtime → poll
    const t = setInterval(() => refresh(true), POLL_INTERVAL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSupabase, authUserId]);

  function handleItemClick(n: Notification) {
    setOpen(false);
    if (!n.read_at) {
      // Optimistic
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      startTransition(() => {
        markNotificationReadAction(n.id);
      });
    }
    if (n.link) router.push(n.link);
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: new Date().toISOString() })));
    setUnread(0);
    startTransition(() => {
      markAllNotificationsReadAction();
    });
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refresh(false);
        }}
        className="relative rounded-2xl p-3 text-[var(--text-soft)] hover:bg-[var(--surface-alt)]"
        aria-label="Thông báo"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-white rounded-xl shadow-2xl border border-zinc-200 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-zinc-800">Thông báo</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {unread} mới
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Chưa có thông báo nào
              </div>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleItemClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-zinc-50 border-b border-zinc-50 transition-colors ${!n.read_at ? "bg-indigo-50/30" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.read_at ? "bg-indigo-500" : "bg-transparent"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${!n.read_at ? "font-semibold text-zinc-900" : "text-zinc-700"} truncate`}>
                            {n.title}
                          </div>
                          {n.body && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</div>}
                          <div className="text-[10px] text-zinc-400 mt-1">{formatRelative(n.created_at)}</div>
                        </div>
                        {!n.read_at && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-1" />}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-2 border-t border-zinc-100 text-[10px] text-zinc-400 text-center">
            {hasSupabase ? "🔴 Realtime" : "⏱ Poll mỗi 20s"}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
