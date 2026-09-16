import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NewPropertyForm } from "./new-property-form";

export default async function NewPropertyPage() {
  const [subCities, t] = await Promise.all([
    prisma.subCity.findMany({ orderBy: { name: "asc" } }),
    getTranslations("property"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("registerPageTitle")}</CardTitle>
          <CardDescription>{t("registerPageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <NewPropertyForm subCities={subCities} />
        </CardContent>
      </Card>
    </div>
  );
}
