import Link from "next/link";
import { Search, ShieldCheck, FileCheck2, Receipt } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import { PublicHeader } from "@/components/shared/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const [propertyCount, agreementCount, subCityCount, t, tNav] = await Promise.all([
    prisma.property.count({ where: { isListed: true, status: "APPROVED" } }),
    prisma.rentalAgreement.count({ where: { status: "ACTIVE" } }),
    prisma.subCity.count(),
    getTranslations("home"),
    getTranslations("nav"),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/properties">
                <Search className="size-4" /> {tNav("findAHome")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">{t("registerAsOwner")}</Link>
            </Button>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-sm">
            <Stat label={t("availableHomes")} value={propertyCount} />
            <Stat label={tNav("activeAgreements")} value={agreementCount} />
            <Stat label={t("subCitiesCovered")} value={subCityCount} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
        <Feature icon={FileCheck2} title={t("feature1Title")} description={t("feature1Description")} />
        <Feature icon={Receipt} title={t("feature2Title")} description={t("feature2Description")} />
        <Feature icon={ShieldCheck} title={t("feature3Title")} description={t("feature3Description")} />
      </section>

      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">{t("footer")}</footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-2">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
