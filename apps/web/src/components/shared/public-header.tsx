import Link from "next/link";
import { Building2 } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { DASHBOARD_PATH_BY_ROLE } from "@/lib/auth/permissions";

export async function PublicHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          Rental &amp; Tax Management
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/properties">Find a Home</Link>
          </Button>
          <LanguageSwitcher />
          {session?.user ? (
            <Button asChild size="sm">
              <Link href={DASHBOARD_PATH_BY_ROLE[session.user.role] as never}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
