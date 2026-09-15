import { UserRole } from "@/generated/prisma/enums";

// Central permission map. Every server action / route handler must check
// permissions here instead of scattering `role === "X"` checks around the
// codebase. Hiding a button in the UI is never sufficient on its own.

export const PERMISSIONS = {
  PROPERTY_CREATE: "PROPERTY_CREATE",
  PROPERTY_EDIT_OWN: "PROPERTY_EDIT_OWN",
  PROPERTY_REVIEW: "PROPERTY_REVIEW",
  PROPERTY_VIEW_ALL: "PROPERTY_VIEW_ALL",

  TENANT_REGISTER: "TENANT_REGISTER",

  AGREEMENT_CREATE: "AGREEMENT_CREATE",
  AGREEMENT_REVIEW: "AGREEMENT_REVIEW",
  AGREEMENT_TERMINATE_REQUEST: "AGREEMENT_TERMINATE_REQUEST",
  AGREEMENT_VIEW_ALL: "AGREEMENT_VIEW_ALL",

  PAYMENT_INITIATE: "PAYMENT_INITIATE",
  PAYMENT_VIEW_ALL: "PAYMENT_VIEW_ALL",

  TAX_VIEW: "TAX_VIEW",
  TAX_ASSESS: "TAX_ASSESS",
  TAX_RULE_MANAGE: "TAX_RULE_MANAGE",

  PENALTY_VIEW: "PENALTY_VIEW",
  PENALTY_REVIEW: "PENALTY_REVIEW",
  PENALTY_RULE_MANAGE: "PENALTY_RULE_MANAGE",

  PRICE_RULE_MANAGE: "PRICE_RULE_MANAGE",

  SYSTEM_CONFIG_MANAGE: "SYSTEM_CONFIG_MANAGE",
  USER_MANAGE: "USER_MANAGE",
  AUDIT_VIEW: "AUDIT_VIEW",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PROPERTY_OWNER: [
    "PROPERTY_CREATE",
    "PROPERTY_EDIT_OWN",
    "TENANT_REGISTER",
    "AGREEMENT_CREATE",
    "AGREEMENT_TERMINATE_REQUEST",
    "PAYMENT_INITIATE",
    "TAX_VIEW",
  ],
  TENANT: [
    "AGREEMENT_TERMINATE_REQUEST",
    "PAYMENT_INITIATE",
    "TAX_VIEW",
  ],
  HOUSING_OFFICER: [
    "PROPERTY_REVIEW",
    "PROPERTY_VIEW_ALL",
    "AGREEMENT_REVIEW",
    "AGREEMENT_VIEW_ALL",
    "PENALTY_VIEW",
    "PENALTY_REVIEW",
  ],
  TAX_OFFICER: [
    "TAX_VIEW",
    "TAX_ASSESS",
    "AGREEMENT_VIEW_ALL",
    "PAYMENT_VIEW_ALL",
    "PENALTY_VIEW",
    "PENALTY_REVIEW",
  ],
  SUPER_ADMIN: [
    "PROPERTY_VIEW_ALL",
    "PROPERTY_REVIEW",
    "AGREEMENT_VIEW_ALL",
    "AGREEMENT_REVIEW",
    "PAYMENT_VIEW_ALL",
    "TAX_VIEW",
    "TAX_ASSESS",
    "TAX_RULE_MANAGE",
    "PENALTY_VIEW",
    "PENALTY_REVIEW",
    "PENALTY_RULE_MANAGE",
    "PRICE_RULE_MANAGE",
    "SYSTEM_CONFIG_MANAGE",
    "USER_MANAGE",
    "AUDIT_VIEW",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Role ${role} lacks permission ${permission}`);
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export const DASHBOARD_PATH_BY_ROLE: Record<UserRole, string> = {
  PROPERTY_OWNER: "/dashboard/owner",
  TENANT: "/dashboard/tenant",
  HOUSING_OFFICER: "/dashboard/housing",
  TAX_OFFICER: "/dashboard/tax",
  SUPER_ADMIN: "/dashboard/admin",
};
