import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RegisterTenantForm } from "./register-tenant-form";

export default async function NewTenantPage() {
  const t = await getTranslations("tenant");
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("registerPageTitle")}</CardTitle>
          <CardDescription>{t("registerPageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterTenantForm />
        </CardContent>
      </Card>
    </div>
  );
}
