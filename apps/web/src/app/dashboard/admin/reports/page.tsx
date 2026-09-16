import { Wallet, Receipt, ShieldAlert, FileText } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getMonthlyRevenueTrend } from "@/lib/services/dashboard.service";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/shared/revenue-trend-chart";

export default async function AdminReportsPage() {
  const [allTrend, taxCollected, serviceFeeCollected, penaltyCollected, activeAgreements] = await Promise.all([
    getMonthlyRevenueTrend(undefined),
    prisma.payment.aggregate({ _sum: { amountEtb: true }, where: { status: "COMPLETED", purpose: "TAX" } }),
    prisma.payment.aggregate({ _sum: { amountEtb: true }, where: { status: "COMPLETED", purpose: "SERVICE_FEE" } }),
    prisma.payment.aggregate({ _sum: { amountEtb: true }, where: { status: "COMPLETED", purpose: "PENALTY" } }),
    prisma.rentalAgreement.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="System-wide revenue and activity overview." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tax Collected" value={`${Number(taxCollected._sum.amountEtb ?? 0).toLocaleString()} ETB`} icon={Receipt} />
        <StatCard label="Service Fees Collected" value={`${Number(serviceFeeCollected._sum.amountEtb ?? 0).toLocaleString()} ETB`} icon={Wallet} />
        <StatCard label="Penalties Collected" value={`${Number(penaltyCollected._sum.amountEtb ?? 0).toLocaleString()} ETB`} icon={ShieldAlert} />
        <StatCard label="Active Agreements" value={activeAgreements} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Revenue — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={allTrend} />
        </CardContent>
      </Card>
    </div>
  );
}
