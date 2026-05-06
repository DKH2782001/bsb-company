import * as demo from "@/lib/queries/demo";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { getAuthenticatedUser, getDbClientOrThrow, getServiceClient, getUserContext } from "@/lib/repositories/shared";
import type { Notification } from "@/types/domain";

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function shouldUseDemoStore() {
  return isDemoMode() || !hasSupabaseEnv();
}

/** Trả notifications của user hiện tại (mới nhất trước). */
export async function listMyNotifications(limit = 20): Promise<Notification[]> {
  const user = await getAuthenticatedUser();
  const authUserId = user?.id ?? demo.DEMO_AUTH_USER_ID;

  if (shouldUseDemoStore()) {
    return demo.demoNotifications
      .filter((n) => n.auth_user_id === authUserId)
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  try {
    const db = await getDbClientOrThrow();
    const { data } = await (db.from("notifications") as unknown as {
      select: (s: string) => { eq: (c: string, v: string) => { order: (c: string, opt: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: Notification[] | null }> } } };
    })
      .select("*")
      .eq("auth_user_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

/** Đếm số notification chưa đọc của user hiện tại. */
export async function countMyUnread(): Promise<number> {
  const user = await getAuthenticatedUser();
  const authUserId = user?.id ?? demo.DEMO_AUTH_USER_ID;

  if (shouldUseDemoStore()) {
    return demo.demoNotifications.filter((n) => n.auth_user_id === authUserId && !n.read_at).length;
  }

  try {
    const db = await getDbClientOrThrow();
    const { count } = await (db.from("notifications") as unknown as {
      select: (s: string, opt: { count: "exact"; head: true }) => {
        eq: (c: string, v: string) => { is: (c: string, v: null) => Promise<{ count: number | null }> };
      };
    })
      .select("*", { count: "exact", head: true })
      .eq("auth_user_id", authUserId)
      .is("read_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Tạo notification cho 1 user. Dùng service role để gọi từ bất kỳ context nào (server action). */
export async function createNotification(input: {
  authUserId: string;
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<Notification | null> {
  const actor = await getAuthenticatedUser();
  const context = await getUserContext(actor);
  if (!context.companyId) return null;

  const newNoti: Notification = {
    id: genId("n"),
    company_id: context.companyId,
    auth_user_id: input.authUserId,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    read_at: null,
    created_at: new Date().toISOString(),
  };

  if (shouldUseDemoStore()) {
    demo.demoNotifications.unshift(newNoti);
    if (demo.demoNotifications.length > 200) demo.demoNotifications.length = 200;
    return newNoti;
  }

  try {
    const service = await getServiceClient();
    const { data } = await (service.from("notifications") as unknown as {
      insert: (v: Record<string, unknown>) => { select: (s: string) => { single: () => Promise<{ data: Notification | null }> } };
    })
      .insert({
        company_id: context.companyId,
        auth_user_id: input.authUserId,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      })
      .select("*")
      .single();
    return data;
  } catch (err) {
    console.warn("[createNotification] failed:", err);
    return null;
  }
}

/** Tạo notification cho nhiều user cùng lúc. */
export async function createNotificationsForUsers(input: {
  authUserIds: string[];
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<void> {
  for (const id of input.authUserIds) {
    if (!id) continue;
    await createNotification({ authUserId: id, title: input.title, body: input.body, link: input.link });
  }
}

/** Đánh dấu 1 notification đã đọc. Chỉ owner mới được mark. */
export async function markNotificationRead(id: string): Promise<void> {
  const user = await getAuthenticatedUser();
  const authUserId = user?.id ?? demo.DEMO_AUTH_USER_ID;

  if (shouldUseDemoStore()) {
    const idx = demo.demoNotifications.findIndex((n) => n.id === id && n.auth_user_id === authUserId);
    if (idx >= 0 && !demo.demoNotifications[idx].read_at) {
      demo.demoNotifications[idx] = { ...demo.demoNotifications[idx], read_at: new Date().toISOString() };
    }
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    await (db.from("notifications") as unknown as {
      update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<unknown> } };
    })
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("auth_user_id", authUserId);
  } catch (err) {
    console.warn("[markNotificationRead] failed:", err);
  }
}

/** Đánh dấu tất cả notification của user là đã đọc. */
export async function markAllMyNotificationsRead(): Promise<void> {
  const user = await getAuthenticatedUser();
  const authUserId = user?.id ?? demo.DEMO_AUTH_USER_ID;
  const now = new Date().toISOString();

  if (shouldUseDemoStore()) {
    for (let i = 0; i < demo.demoNotifications.length; i++) {
      if (demo.demoNotifications[i].auth_user_id === authUserId && !demo.demoNotifications[i].read_at) {
        demo.demoNotifications[i] = { ...demo.demoNotifications[i], read_at: now };
      }
    }
    return;
  }

  try {
    const db = await getDbClientOrThrow();
    await (db.from("notifications") as unknown as {
      update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => { is: (c: string, v: null) => Promise<unknown> } };
    })
      .update({ read_at: now })
      .eq("auth_user_id", authUserId)
      .is("read_at", null);
  } catch (err) {
    console.warn("[markAllMyNotificationsRead] failed:", err);
  }
}
