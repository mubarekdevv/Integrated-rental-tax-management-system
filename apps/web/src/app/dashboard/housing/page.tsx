import Link from "next/link";
import { Home, FileText, LogOut, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getHousingOfficerDashboard } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function HousingDashboardPage() {
  const [{ pendingProperties, pendingAgreements, terminationRequests }, correctionCount] = await Promise.all([
    getHousingOfficerDashboard(),
    prisma.property.count({ where: { status: "CORRECTION_REQUIRED" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Housing Officer Dashboard" description="Your review queue and recent activity." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties to Review" value={pendingProperties.length} icon={Home} />
        <StatCard label="Agreements to Review" value={pendingAgreements.length} icon={FileText} />
        <StatCard label="Termination Requests" value={terminationRequests.length} icon={LogOut} />
        <StatCard label="Correction Requests" value={correctionCount} icon={ShieldAlert} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Properties Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingProperties.length === 0 && <p className="text-sm text-muted-foreground">Queue is empty.</p>}
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
          <CardTitle>Agreements Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingAgreements.length === 0 && <p className="text-sm text-muted-foreground">Queue is empty.</p>}
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
