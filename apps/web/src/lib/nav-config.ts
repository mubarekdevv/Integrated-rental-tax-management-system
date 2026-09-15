import type { UserRole } from "@/generated/prisma/enums";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Home,
  FileText,
  Users,
  Search,
  Receipt,
  ShieldAlert,
  Settings,
  History,
  UserCog,
  Percent,
  Landmark,
  PlusCircle,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Bell,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const NAV_ITEMS_BY_ROLE: Record<UserRole, NavItem[]> = {
  PROPERTY_OWNER: [
    { href: "/dashboard/owner", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/owner/properties", labelKey: "myProperties", icon: Home },
    { href: "/dashboard/owner/properties/new", labelKey: "registerProperty", icon: PlusCircle },
    { href: "/dashboard/owner/tenants", labelKey: "myTenants", icon: Users },
    { href: "/dashboard/owner/agreements", labelKey: "agreements", icon: FileText },
    { href: "/dashboard/owner/payments", labelKey: "payments", icon: Wallet },
    { href: "/dashboard/owner/tax", labelKey: "taxInfo", icon: Receipt },
    { href: "/dashboard/notifications", labelKey: "notifications", icon: Bell },
    { href: "/dashboard/owner/profile", labelKey: "profile", icon: UserCog },
  ],
  TENANT: [
    { href: "/dashboard/tenant", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/properties", labelKey: "findProperties", icon: Search },
    { href: "/dashboard/tenant/agreements", labelKey: "myRental", icon: FileText },
    { href: "/dashboard/tenant/payments", labelKey: "payments", icon: Wallet },
    { href: "/dashboard/notifications", labelKey: "notifications", icon: Bell },
    { href: "/dashboard/tenant/profile", labelKey: "profile", icon: UserCog },
  ],
  HOUSING_OFFICER: [
    { href: "/dashboard/housing", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/housing/properties", labelKey: "propertyRegistrations", icon: Home },
    { href: "/dashboard/housing/properties/pending", labelKey: "propertyReview", icon: AlertTriangle },
    { href: "/dashboard/housing/agreements", labelKey: "agreementReview", icon: FileText },
    { href: "/dashboard/housing/corrections", labelKey: "correctionRequests", icon: ShieldAlert },
    { href: "/dashboard/housing/properties/approved", labelKey: "approvedProperties", icon: CheckCircle2 },
    { href: "/dashboard/housing/agreements/active", labelKey: "activeAgreements", icon: ShieldCheck },
    { href: "/dashboard/housing/terminations", labelKey: "terminations", icon: History },
    { href: "/dashboard/housing/search", labelKey: "search", icon: Search },
    { href: "/dashboard/notifications", labelKey: "notifications", icon: Bell },
  ],
  TAX_OFFICER: [
    { href: "/dashboard/tax", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tax/assessments", labelKey: "taxAssessments", icon: Receipt },
    { href: "/dashboard/tax/payments", labelKey: "taxPayments", icon: Wallet },
    { href: "/dashboard/tax/overdue", labelKey: "overdueTax", icon: AlertTriangle },
    { href: "/dashboard/tax/penalties", labelKey: "penalties", icon: ShieldAlert },
    { href: "/dashboard/tax/price-discrepancies", labelKey: "priceDiscrepancies", icon: Percent },
    { href: "/dashboard/tax/search", labelKey: "taxpayerSearch", icon: Search },
    { href: "/dashboard/tax/reports", labelKey: "reports", icon: BarChart3 },
    { href: "/dashboard/notifications", labelKey: "notifications", icon: Bell },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard/admin", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", labelKey: "users", icon: Users },
    { href: "/dashboard/admin/roles", labelKey: "rolesPermissions", icon: ShieldCheck },
    { href: "/dashboard/admin/properties", labelKey: "properties", icon: Home },
    { href: "/dashboard/admin/agreements", labelKey: "agreements", icon: FileText },
    { href: "/dashboard/admin/tax-rules", labelKey: "taxRules", icon: Percent },
    { href: "/dashboard/admin/penalty-rules", labelKey: "penaltyRules", icon: ShieldAlert },
    { href: "/dashboard/admin/price-rules", labelKey: "priceRules", icon: Landmark },
    { href: "/dashboard/admin/settings", labelKey: "systemConfig", icon: Settings },
    { href: "/dashboard/admin/audit-log", labelKey: "auditLog", icon: History },
    { href: "/dashboard/admin/reports", labelKey: "reports", icon: BarChart3 },
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  PROPERTY_OWNER: "Property Owner",
  TENANT: "Tenant",
  HOUSING_OFFICER: "Housing Officer",
  TAX_OFFICER: "Tax Officer",
  SUPER_ADMIN: "Super Admin",
};
