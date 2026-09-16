import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PropertiesTable } from "@/components/property/properties-table";

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: { subCity: true, createdBy: true },
    take: 300,
  });

  return (
    <div>
      <PageHeader title="Properties" description="Every property registered in the system." />
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
        detailBasePath="/dashboard/admin/properties"
      />
    </div>
  );
}
