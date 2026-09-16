import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { DASHBOARD_PATH_BY_ROLE } from "@/lib/auth/permissions";
import type { UserRole } from "@/generated/prisma/enums";

// Maps each dashboard section's URL segment to the role allowed in it —
// mirrors DASHBOARD_PATH_BY_ROLE (src/lib/auth/permissions.ts) in reverse.
const SECTION_ROLE: Record<string, UserRole> = {
  owner: "PROPERTY_OWNER",
  tenant: "TENANT",
  housing: "HOUSING_OFFICER",
  tax: "TAX_OFFICER",
  admin: "SUPER_ADMIN",
};

// Every server action and route handler still enforces real authorization
// independently (see src/lib/auth/session.ts) for writes. For dashboard
// *reads*, this proxy is the security boundary for the role check: each
// section also has its own server-side `requireRole()` layout guard
// (src/lib/auth/require-role.ts) as defense-in-depth, but that guard only
// re-runs when Next.js decides to re-render the route — it is not reliably
// invoked on every request, so cross-role access must be blocked here,
// which runs on every request unconditionally.
export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isDashboardRoute && !session?.user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isDashboardRoute && session?.user) {
    // Bare "/dashboard" (no section) relies on a page-level redirect that,
    // like the section layouts above, isn't reliably re-invoked per
    // request — send it straight to the right section here instead.
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.redirect(
        new URL(DASHBOARD_PATH_BY_ROLE[session.user.role], request.url)
      );
    }

    const section = pathname.split("/")[2];
    const requiredRole = section ? SECTION_ROLE[section] : undefined;
    if (requiredRole && session.user.role !== requiredRole) {
      return NextResponse.redirect(
        new URL(DASHBOARD_PATH_BY_ROLE[session.user.role], request.url)
      );
    }
  }

  if (isAuthRoute && session?.user) {
    return NextResponse.redirect(
      new URL(DASHBOARD_PATH_BY_ROLE[session.user.role], request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
