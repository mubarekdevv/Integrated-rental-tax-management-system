"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationReadAction } from "@/server/actions/notifications";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationRow({ notification }: { notification: NotificationItem }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={notification.isRead || pending}
      onClick={() =>
        startTransition(async () => {
          await markNotificationReadAction(notification.id);
          router.refresh();
        })
      }
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted disabled:cursor-default",
        !notification.isRead && "bg-primary/5"
      )}
    >
      {!notification.isRead && <Circle className="mt-1.5 size-2 shrink-0 fill-primary text-primary" />}
      <div className={cn("min-w-0 flex-1", notification.isRead && "pl-5")}>
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm", !notification.isRead && "font-semibold")}>{notification.title}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
      </div>
    </button>
  );
}
