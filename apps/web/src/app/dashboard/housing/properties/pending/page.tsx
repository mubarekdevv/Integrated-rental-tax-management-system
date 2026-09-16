import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PropertiesTable } from "@/components/property/properties-table";
import { PropertyViewTabs } from "@/components/property/property-view-tabs";

export default async function HousingPropertiesPendingPage() {
  const [properties, t] = await Promise.all([
    prisma.property.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      include: { subCity: true, createdBy: true },
    }),
    getTranslations("property"),
  ]);

  return (
    <div>
      <PageHeader title={t("pendingReviewTitle")} description={t("pendingReviewDescription")} />
      <PropertyViewTabs active="pending" />
      <PropertiesTable
        properties={properties.map((p) => ({
          id: p.id,
          code: p.code,
          title: p.title,
          subCityName: p.subCity.name,
          ownerName: `${p.createdBy.firstName} ${p.createdBy.lastName}`,
          askingRentEtb: Number(p.askingRentEtb),
          status: p.status,
        }))}
        detailBasePath="/dashboard/housing/properties"
      />
    </div>
  );
}
