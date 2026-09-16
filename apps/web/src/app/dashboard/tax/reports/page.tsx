import { Receipt, Wallet, ShieldAlert, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getMonthlyRevenueTrend } from "@/lib/services/dashboard.service";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/shared/revenue-trend-chart";

export default async function TaxReportsPage() {
  const [trend, assessedTotal, collectedTotal, overdueCount, penaltyTotal] = await Promise.all([
    getMonthlyRevenueTrend("TAX"),
    prisma.taxAssessment.aggregate({ _sum: { taxAmountEtb: true } }),
    prisma.taxAssessment.aggregate({ _sum: { taxAmountEtb: true }, where: { status: "PAID" } }),
    prisma.taxAssessment.count({ where: { status: "OVERDUE" } }),
    prisma.penalty.aggregate({ _sum: { calculatedAmountEtb: true }, where: { status: "PAID" } }),
  ]);

  const assessed = Number(assessedTotal._sum.taxAmountEtb ?? 0);
  const collected = Number(collectedTotal._sum.taxAmountEtb ?? 0);
  const collectionRate = assessed > 0 ? Math.round((collected / assessed) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Tax Reports" description="Revenue trend and collection performance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Assessed" value={`${assessed.toLocaleString()} ETB`} icon={Receipt} />
        <StatCard label="Total Collected" value={`${collected.toLocaleString()} ETB`} icon={Wallet} hint={`${collectionRate}% collection rate`} />
        <StatCard label="Overdue Assessments" value={overdueCount} icon={TrendingUp} />
        <StatCard label="Penalties Collected" value={`${Number(penaltyTotal._sum.calculatedAmountEtb ?? 0).toLocaleString()} ETB`} icon={ShieldAlert} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Collected — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={trend} />
        </CardContent>
      </Card>
    </div>
  );
}
