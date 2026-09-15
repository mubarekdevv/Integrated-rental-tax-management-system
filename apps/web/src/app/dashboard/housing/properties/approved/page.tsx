import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PropertiesTable } from "@/components/property/properties-table";
import { PropertyViewTabs } from "@/components/property/property-view-tabs";

export default async function HousingPropertiesApprovedPage() {
  const properties = await prisma.property.findMany({
    where: { status: { in: ["APPROVED", "ACTIVE"] } },
    orderBy: { approvedAt: "desc" },
    include: { subCity: true, createdBy: true },
  });

  return (
    <div>
      <PageHeader title="Approved Properties" description="Properties cleared for rental agreements." />
      <PropertyViewTabs active="approved" />
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
