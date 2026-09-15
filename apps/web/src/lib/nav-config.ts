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
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS_BY_ROLE: Record<UserRole, NavItem[]> = {
  PROPERTY_OWNER: [
    { href: "/dashboard/owner", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/owner/properties", label: "My Properties", icon: Home },
    { href: "/dashboard/owner/agreements", label: "My Agreements", icon: FileText },
    { href: "/dashboard/owner/tax", label: "Tax", icon: Receipt },
    { href: "/dashboard/owner/profile", label: "My Profile", icon: UserCog },
  ],
  TENANT: [
    { href: "/dashboard/tenant", label: "Dashboard", icon: LayoutDashboard },
    { href: "/properties", label: "Find a Home", icon: Search },
    { href: "/dashboard/tenant/agreements", label: "My Agreements", icon: FileText },
    { href: "/dashboard/tenant/profile", label: "My Profile", icon: UserCog },
  ],
  HOUSING_OFFICER: [
    { href: "/dashboard/housing", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/housing/properties", label: "Property Reviews", icon: Home },
    { href: "/dashboard/housing/agreements", label: "Agreement Reviews", icon: FileText },
    { href: "/dashboard/housing/terminations", label: "Terminations", icon: History },
    { href: "/dashboard/housing/penalties", label: "Penalties", icon: ShieldAlert },
  ],
  TAX_OFFICER: [
    { href: "/dashboard/tax", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/tax/assessments", label: "Tax Assessments", icon: Receipt },
    { href: "/dashboard/tax/penalties", label: "Penalties", icon: ShieldAlert },
  ],
  SUPER_ADMIN: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/tax-rules", label: "Tax Rules", icon: Percent },
    { href: "/dashboard/admin/price-rules", label: "Price Rules", icon: Landmark },
    { href: "/dashboard/admin/penalty-rules", label: "Penalty Rules", icon: ShieldAlert },
    { href: "/dashboard/admin/audit-log", label: "Audit Log", icon: History },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  PROPERTY_OWNER: "Property Owner",
  TENANT: "Tenant",
  HOUSING_OFFICER: "Housing Officer",
  TAX_OFFICER: "Tax Officer",
  SUPER_ADMIN: "Super Admin",
};
