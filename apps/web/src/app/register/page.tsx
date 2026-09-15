import Link from "next/link";
import { Building2, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");
  const tNav = await getTranslations("nav");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Building2 className="size-6" />
          </div>
          <h1 className="text-lg font-semibold">{tApp("name")}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("registerTitle")}</CardTitle>
            <CardDescription>{t("registerSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <div className="mt-4 flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <p>
                Housing officer, tax officer and administrator accounts are not self-registered — they are
                provisioned by a system administrator for accountability and security.
              </p>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("haveAccount")}{" "}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                {tNav("login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
