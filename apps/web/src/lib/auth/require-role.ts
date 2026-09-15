import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { DASHBOARD_PATH_BY_ROLE } from "@/lib/auth/permissions";
import type { UserRole } from "@/generated/prisma/enums";

/** Server-side, defense-in-depth role gate for a dashboard section layout. */
export async function requireRole(role: UserRole) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== role) {
    redirect(DASHBOARD_PATH_BY_ROLE[session.user.role] as never);
  }
  return session.user;
}
