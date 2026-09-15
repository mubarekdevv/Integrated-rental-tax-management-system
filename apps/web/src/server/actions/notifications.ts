"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/services/notifications";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();
  await markNotificationRead(notificationId, user.id);
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  revalidatePath("/dashboard/notifications");
}
