import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <DashboardShell
      role={session.user.role}
      userName={`${session.user.firstName} ${session.user.lastName}`}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
