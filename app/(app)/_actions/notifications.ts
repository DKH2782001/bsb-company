"use server";

import { revalidatePath } from "next/cache";
import {
  listMyNotifications,
  countMyUnread,
  markNotificationRead,
  markAllMyNotificationsRead,
} from "@/lib/repositories/notifications";
import type { Notification } from "@/types/domain";

export async function fetchMyNotificationsAction(limit = 20): Promise<{ items: Notification[]; unread: number }> {
  const [items, unread] = await Promise.all([listMyNotifications(limit), countMyUnread()]);
  return { items, unread };
}

export async function markNotificationReadAction(id: string): Promise<void> {
  if (!id) return;
  await markNotificationRead(id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  await markAllMyNotificationsRead();
  revalidatePath("/", "layout");
}
