import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { DASHBOARD_PATH_BY_ROLE } from "@/lib/auth/permissions";

// Optimistic, cookie-based redirect only. Every server action and route
// handler still enforces real authorization independently (see
// src/lib/auth/session.ts) — this proxy is a UX convenience, not the
// security boundary.
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
