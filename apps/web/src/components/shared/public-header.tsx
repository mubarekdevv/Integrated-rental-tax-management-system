import Link from "next/link";
import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { DASHBOARD_PATH_BY_ROLE } from "@/lib/auth/permissions";

export async function PublicHeader() {
  const [session, t, tApp] = await Promise.all([auth(), getTranslations("nav"), getTranslations("app")]);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <span className="hidden sm:inline">{tApp("name")}</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/properties" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {t("findAHome")}
          </Link>
          <LanguageSwitcher />
          {session?.user ? (
            <Link
              href={DASHBOARD_PATH_BY_ROLE[session.user.role] as never}
              className={buttonVariants({ size: "sm" })}
            >
              {t("dashboard")}
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                {t("login")}
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>
                {t("register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
