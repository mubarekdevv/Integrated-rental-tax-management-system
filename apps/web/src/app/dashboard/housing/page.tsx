import Link from "next/link";
import { Home, FileText, LogOut, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import { getHousingOfficerDashboard } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function HousingDashboardPage() {
  const [{ pendingProperties, pendingAgreements, terminationRequests }, correctionCount, tDash] = await Promise.all([
    getHousingOfficerDashboard(),
    prisma.property.count({ where: { status: "CORRECTION_REQUIRED" } }),
    getTranslations("dashboard"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={tDash("housingTitle")} description={tDash("housingSubtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={tDash("propertiesToReview")} value={pendingProperties.length} icon={Home} />
        <StatCard label={tDash("agreementsToReview")} value={pendingAgreements.length} icon={FileText} />
        <StatCard label={tDash("terminationRequests")} value={terminationRequests.length} icon={LogOut} />
        <StatCard label={tDash("correctionRequests")} value={correctionCount} icon={ShieldAlert} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tDash("propertiesAwaitingReview")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingProperties.length === 0 && <p className="text-sm text-muted-foreground">{tDash("queueEmpty")}</p>}
          {pendingProperties.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/housing/properties/${p.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.subCity.name} &middot; {p.createdBy.firstName} {p.createdBy.lastName}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tDash("agreementsAwaitingReview")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingAgreements.length === 0 && <p className="text-sm text-muted-foreground">{tDash("queueEmpty")}</p>}
          {pendingAgreements.slice(0, 6).map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/housing/agreements/${a.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
            >
              <div>
                <p className="font-medium">{a.property.title}</p>
                <p className="text-xs text-muted-foreground font-mono">{a.agreementNumber}</p>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
