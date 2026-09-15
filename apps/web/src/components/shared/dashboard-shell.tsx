"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { NotificationsMenu } from "@/components/shared/notifications-menu";
import { NAV_ITEMS_BY_ROLE, ROLE_LABELS, type NavItem } from "@/lib/nav-config";
import type { UserRole } from "@/generated/prisma/enums";
import { logoutAction } from "@/server/actions/session";

interface DashboardShellProps {
  role: UserRole;
  userName: string;
  notifications: { id: string; title: string; message: string; isRead: boolean; createdAt: Date }[];
  children: React.ReactNode;
}

function NavLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href as never}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ role, userName, notifications, children }: DashboardShellProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS_BY_ROLE[role];

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </div>
        <span className="text-sm font-semibold leading-tight">Rental &amp; Tax Mgmt</span>
      </div>
      <NavLinks items={items} pathname={pathname} />
      <div className="mt-auto space-y-2 border-t pt-4">
        <p className="px-2 text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        <p className="px-2 text-sm font-medium">{userName}</p>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
            <LogOut className="size-4" /> Log out
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">{sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b bg-card px-4">
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
          <div className="flex-1" />
          <NotificationsMenu notifications={notifications} />
          <LanguageSwitcher />
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
