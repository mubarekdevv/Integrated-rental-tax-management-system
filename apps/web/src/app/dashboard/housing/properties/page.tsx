import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PropertiesTable } from "@/components/property/properties-table";
import { PropertyViewTabs } from "@/components/property/property-view-tabs";

export default async function HousingPropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: { subCity: true, createdBy: true },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Property Registrations" description="Every property registered in the system, across all statuses." />
      <PropertyViewTabs active="all" />
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
