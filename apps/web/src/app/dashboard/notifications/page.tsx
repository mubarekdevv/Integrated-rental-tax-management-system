import { Bell } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationRow } from "./notification-row";
import { MarkAllReadButton } from "./mark-all-read-button";

export default async function NotificationsPage() {
  const session = await auth();
  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.` : "You're all caught up."}
        actions={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="System and workflow updates will appear here." />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
