import "server-only";
import { auth } from "@/lib/auth/auth";
import { assertPermission, type Permission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/auth/permissions";

export class UnauthenticatedError extends Error {
  constructor(message = "You must be signed in to do this.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

/** Real, server-side authorization boundary for every Server Action / Route Handler. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthenticatedError();
  }
  return session.user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  assertPermission(user.role, permission);
  return user;
}

export { ForbiddenError };
