"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { NotificationsMenu } from "@/components/shared/notifications-menu";
import { NAV_ITEMS_BY_ROLE, type NavItem } from "@/lib/nav-config";
import type { UserRole } from "@/generated/prisma/enums";
import { logoutAction } from "@/server/actions/session";

interface DashboardShellProps {
  role: UserRole;
  userName: string;
  notifications: { id: string; title: string; message: string; isRead: boolean; createdAt: Date }[];
  children: React.ReactNode;
}

function NavLinks({ items, pathname, t }: { items: NavItem[]; pathname: string; t: (key: string) => string }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (!["/dashboard/owner", "/dashboard/tenant", "/dashboard/housing", "/dashboard/tax", "/dashboard/admin"].includes(
            item.href
          ) &&
            pathname.startsWith(item.href + "/"));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href as never}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ role, userName, notifications, children }: DashboardShellProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS_BY_ROLE[role];
  const t = useTranslations("nav");
  const tRoles = useTranslations("roles");
  const tApp = useTranslations("app");

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href={"/" as never} className="flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </div>
        <span className="text-sm font-semibold leading-tight">{tApp("name")}</span>
      </Link>
      <div className="flex-1 overflow-y-auto">
        <NavLinks items={items} pathname={pathname} t={t} />
      </div>
      <div className="space-y-2 border-t pt-4">
        <p className="px-2 text-xs text-muted-foreground">{tRoles(role)}</p>
        <p className="truncate px-2 text-sm font-medium">{userName}</p>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
            <LogOut className="size-4" /> {t("logout")}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">{sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b bg-card/95 px-4 backdrop-blur">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium lg:hidden">{tApp("name")}</span>
          <div className="flex-1" />
          <NotificationsMenu notifications={notifications} />
          <LanguageSwitcher />
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
