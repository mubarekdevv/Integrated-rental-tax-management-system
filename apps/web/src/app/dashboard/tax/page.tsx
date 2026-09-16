import Link from "next/link";
import { Receipt, Wallet, AlertTriangle, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getTaxOfficerDashboard } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssessTaxDialog } from "@/components/tax/assess-tax-dialog";

export default async function TaxDashboardPage() {
  const [{ activeAgreementsWithoutAssessment, assessments, penalties, totals }, tDash] = await Promise.all([
    getTaxOfficerDashboard(),
    getTranslations("dashboard"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={tDash("taxTitle")} description={tDash("taxSubtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={tDash("taxAssessedTotal")} value={`${totals.assessed.toLocaleString()} ETB`} icon={Receipt} />
        <StatCard label={tDash("taxCollectedTotal")} value={`${totals.collected.toLocaleString()} ETB`} icon={Wallet} />
        <StatCard label={tDash("notYetAssessed")} value={activeAgreementsWithoutAssessment.length} icon={AlertTriangle} />
        <StatCard label={tDash("openPenalties")} value={penalties.length} icon={ShieldAlert} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tDash("activeAgreementsNoAssessment")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeAgreementsWithoutAssessment.length === 0 && (
            <p className="text-sm text-muted-foreground">{tDash("allAssessed")}</p>
          )}
          {activeAgreementsWithoutAssessment.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Link href={`/dashboard/tax/agreements/${a.id}`} className="font-medium underline">
                  {a.property.title}
                </Link>
                <p className="text-xs text-muted-foreground font-mono">{a.agreementNumber}</p>
              </div>
              <AssessTaxDialog
                agreementId={a.id}
                defaultStart={a.startDate.toISOString().slice(0, 10)}
                defaultEnd={a.endDate.toISOString().slice(0, 10)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tDash("recentAssessments")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {assessments.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{a.agreement.property.title}</p>
                <p className="text-xs text-muted-foreground">
                  {Number(a.taxAmountEtb).toLocaleString()} ETB {tDash("dueOn", { date: a.dueDate.toDateString() })}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{a.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
