import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentsTable } from "@/components/shared/payments-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default async function TenantPaymentsPage() {
  const session = await auth();
  const payments = await prisma.payment.findMany({
    where: { payerId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { agreement: { include: { property: true } }, penalty: true },
  });

  return (
    <div>
      <PageHeader title="Payments" description="Payments you have made on your rental." />
      <Alert className="mb-4">
        <Info className="size-4" />
        <AlertDescription>
          Payments use mock CBE / telebirr / bank / cash providers for demonstration — no real money moves.
        </AlertDescription>
      </Alert>
      <PaymentsTable
        payments={payments.map((p) => ({
          id: p.id,
          purpose: p.purpose,
          providerType: p.providerType,
          referenceNumber: p.referenceNumber,
          amountEtb: Number(p.amountEtb),
          status: p.status,
          createdAt: p.createdAt,
          contextLabel: p.agreement?.property.title ?? p.penalty?.reason,
        }))}
      />
    </div>
  );
}
