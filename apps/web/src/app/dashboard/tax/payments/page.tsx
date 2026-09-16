import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentsTable } from "@/components/shared/payments-table";

export default async function TaxPaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { purpose: "TAX" },
    orderBy: { createdAt: "desc" },
    include: { payer: true, taxAssessment: { include: { agreement: { include: { property: true } } } } },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Tax Payments" description="All tax payments recorded across the system." />
      <PaymentsTable
        showPayer
        payments={payments.map((p) => ({
          id: p.id,
          purpose: p.purpose,
          providerType: p.providerType,
          referenceNumber: p.referenceNumber,
          amountEtb: Number(p.amountEtb),
          status: p.status,
          createdAt: p.createdAt,
          payerName: `${p.payer.firstName} ${p.payer.lastName}`,
          contextLabel: p.taxAssessment?.agreement.property.title,
        }))}
      />
    </div>
  );
}
