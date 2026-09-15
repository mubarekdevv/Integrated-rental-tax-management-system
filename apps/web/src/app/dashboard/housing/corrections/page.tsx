import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PropertiesTable } from "@/components/property/properties-table";
import { AgreementsTable } from "@/components/agreement/agreements-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HousingCorrectionsPage() {
  const [properties, agreements] = await Promise.all([
    prisma.property.findMany({
      where: { status: "CORRECTION_REQUIRED" },
      orderBy: { updatedAt: "desc" },
      include: { subCity: true, createdBy: true },
    }),
    prisma.rentalAgreement.findMany({
      where: { status: "CORRECTION_REQUIRED" },
      orderBy: { updatedAt: "desc" },
      include: { property: true, tenant: { include: { user: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Correction Requests" description="Properties and agreements sent back to the owner for correction." />
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          <AgreementsTable
            agreements={agreements.map((a) => ({
              id: a.id,
              agreementNumber: a.agreementNumber,
              propertyTitle: a.property.title,
              tenantName: `${a.tenant.user.firstName} ${a.tenant.user.lastName}`,
              rentalAmountEtb: Number(a.rentalAmountEtb),
              status: a.status,
            }))}
            detailBasePath="/dashboard/housing/agreements"
          />
        </CardContent>
      </Card>
    </div>
  );
}
