import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AgreementsTable } from "@/components/agreement/agreements-table";

export default async function AdminAgreementsPage() {
  const agreements = await prisma.rentalAgreement.findMany({
    orderBy: { createdAt: "desc" },
    include: { property: true, tenant: { include: { user: true } } },
    take: 300,
  });

  return (
    <div>
      <PageHeader title="Agreements" description="Every rental agreement in the system." />
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
        detailBasePath="/dashboard/admin/agreements"
      />
    </div>
  );
}
