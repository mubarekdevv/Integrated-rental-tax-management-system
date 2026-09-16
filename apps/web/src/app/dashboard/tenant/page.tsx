import Link from "next/link";
import { FileText, Search, Receipt, QrCode } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { getTenantDashboard } from "@/lib/services/dashboard.service";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function TenantDashboardPage() {
  const session = await auth();
  const [data, tDash, tCommon, tNav] = await Promise.all([
    getTenantDashboard(session!.user.id),
    getTranslations("dashboard"),
    getTranslations("common"),
    getTranslations("nav"),
  ]);

  if (!data.profileComplete) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert>
          <AlertTitle>{tDash("completeTenantProfileTitle")}</AlertTitle>
          <AlertDescription>{tDash("completeTenantProfileDescription")}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/tenant/profile">{tCommon("completeProfile")}</Link>
        </Button>
      </div>
    );
  }

  const { agreements, activeAgreement } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tDash("welcomeName", { name: session!.user.firstName })}
        description={tDash("tenantSubtitle")}
        actions={
          <Button asChild variant="outline">
            <Link href="/properties">
              <Search className="size-4" /> {tNav("findAHome")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={tDash("agreementsCount")} value={agreements.length} icon={FileText} />
        <StatCard
          label={tDash("currentRent")}
          value={activeAgreement ? `${Number(activeAgreement.rentalAmountEtb).toLocaleString()} ETB / mo` : "-"}
          icon={Receipt}
        />
        <StatCard label={tCommon("status")} value={activeAgreement?.status.replaceAll("_", " ") ?? tDash("noActiveAgreement")} icon={FileText} />
      </div>

      {activeAgreement?.wulNumber && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <QrCode className="size-8 text-emerald-700 dark:text-emerald-400" />
              <div>
                <p className="font-medium">{tDash("contractIssuedActive")}</p>
                <p className="font-mono text-xs text-muted-foreground">{activeAgreement.wulNumber}</p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/agreements/${activeAgreement.id}/contract`}>{tDash("viewContract")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tDash("myAgreementsCard")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tDash("noAgreementYetSearch")}{" "}
              <Link href="/properties" className="underline">
                {tDash("searchForHome")}
              </Link>
              .
            </p>
          ) : (
            agreements.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/tenant/agreements/${a.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{a.property.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.agreementNumber}</p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
