import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { DASHBOARD_PATH_BY_ROLE } from "@/lib/auth/permissions";

/**
 * Bare "/dashboard" has no content of its own — it exists so that a login
 * without a specific `callbackUrl` (e.g. `loginAction`'s `redirectTo:
 * callbackUrl || "/dashboard"` fallback) has a real destination to land on,
 * instead of 404ing. It immediately forwards to the signed-in user's actual
 * role-specific dashboard.
 */
export default async function DashboardIndexPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  redirect(DASHBOARD_PATH_BY_ROLE[session.user.role] as never);
}
