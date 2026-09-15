import { Percent } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AgreementsTable } from "@/components/agreement/agreements-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function TaxPriceDiscrepanciesPage() {
  const agreements = await prisma.rentalAgreement.findMany({
    where: { priceFlagged: true },
    orderBy: { updatedAt: "desc" },
    include: { property: true, tenant: { include: { user: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Price Discrepancies"
        description="Agreements whose declared rent falls outside the configured expected range for their area and property type."
      />
      <Alert className="mb-4">
        <AlertTitle>Sample configuration</AlertTitle>
        <AlertDescription>
          Expected price ranges are configurable sample data (Admin → Rental Price Rules), not an authoritative legal
          price table.
        </AlertDescription>
      </Alert>
      {agreements.length === 0 ? (
        <EmptyState icon={Percent} title="No discrepancies" description="No agreements are currently flagged for an unusual price." />
      ) : (
        <AgreementsTable
          agreements={agreements.map((a) => ({
            id: a.id,
            agreementNumber: a.agreementNumber,
            propertyTitle: a.property.title,
            tenantName: `${a.tenant.user.firstName} ${a.tenant.user.lastName}`,
            rentalAmountEtb: Number(a.rentalAmountEtb),
            status: a.status,
            priceFlagged: a.priceFlagged,
          }))}
          detailBasePath="/dashboard/tax/agreements"
        />
      )}
    </div>
  );
}
