import Link from "next/link";
import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");
  const tNav = await getTranslations("nav");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Building2 className="size-6" />
          </div>
          <h1 className="text-lg font-semibold">{tApp("name")}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("loginTitle")}</CardTitle>
            <CardDescription>{t("loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm callbackUrl={callbackUrl} />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                {tNav("register")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
