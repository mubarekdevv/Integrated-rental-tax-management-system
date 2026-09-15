import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AgreementsTable } from "@/components/agreement/agreements-table";
import { AgreementViewTabs } from "@/components/agreement/agreement-view-tabs";

export default async function HousingActiveAgreementsPage() {
  const agreements = await prisma.rentalAgreement.findMany({
    where: { status: "ACTIVE" },
    orderBy: { approvedAt: "desc" },
    include: { property: true, tenant: { include: { user: true } } },
  });

  return (
    <div>
      <PageHeader title="Active Agreements" description="Currently occupied rentals with an issued contract agreement." />
      <AgreementViewTabs active="active" />
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
        detailBasePath="/dashboard/housing/agreements"
      />
    </div>
  );
}
