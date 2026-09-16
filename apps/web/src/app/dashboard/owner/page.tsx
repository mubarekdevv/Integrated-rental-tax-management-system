import Link from "next/link";
import { Home, FileText, Clock, Receipt } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { getOwnerDashboard } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function OwnerDashboardPage() {
  const session = await auth();
  const [data, tDash, tCommon, tProperty, tAgreement, tNav] = await Promise.all([
    getOwnerDashboard(session!.user.id),
    getTranslations("dashboard"),
    getTranslations("common"),
    getTranslations("property"),
    getTranslations("agreement"),
    getTranslations("nav"),
  ]);

  if (!data.profileComplete) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert>
          <AlertTitle>{tDash("completeOwnerProfileTitle")}</AlertTitle>
          <AlertDescription>{tDash("completeOwnerProfileDescription")}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/owner/profile">{tCommon("completeProfile")}</Link>
        </Button>
      </div>
    );
  }

  const { properties, agreements, stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tDash("welcomeName", { name: session!.user.firstName })}
        description={tDash("ownerSubtitle")}
        actions={
          <Button asChild>
            <Link href="/dashboard/owner/properties/new">{tProperty("registerNew")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={tDash("properties")} value={stats.totalProperties} icon={Home} />
        <StatCard label={tNav("activeAgreements")} value={stats.activeAgreements} icon={FileText} />
        <StatCard label={tDash("pendingReview")} value={stats.pendingReview} icon={Clock} />
        <StatCard label={tDash("unpaidTaxItems")} value={stats.unpaidTax} icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tDash("myPropertiesCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tDash("notRegisteredPropertyYet")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tProperty("propertyTitle")}</TableHead>
                    <TableHead>{tProperty("subCity")}</TableHead>
                    <TableHead>{tProperty("askingRent")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                    <TableHead className="text-right">{tCommon("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.subCity.name}</TableCell>
                      <TableCell>{Number(p.askingRentEtb).toLocaleString()} ETB</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/owner/properties/${p.id}`}>{tCommon("view")}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 text-right">
            <Button asChild variant="link">
              <Link href="/dashboard/owner/properties">{tDash("viewAllProperties")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tDash("myAgreementsCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tDash("noAgreementsYet")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tAgreement("agreementHash")}</TableHead>
                    <TableHead>{tAgreement("propertyField")}</TableHead>
                    <TableHead>{tAgreement("tenantField")}</TableHead>
                    <TableHead>{tProperty("rent")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                    <TableHead className="text-right">{tCommon("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.slice(0, 5).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.agreementNumber}</TableCell>
                      <TableCell>{a.property.title}</TableCell>
                      <TableCell>
                        {a.tenant.user.firstName} {a.tenant.user.lastName}
                      </TableCell>
                      <TableCell>{Number(a.rentalAmountEtb).toLocaleString()} ETB</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/owner/agreements/${a.id}`}>{tCommon("view")}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 text-right">
            <Button asChild variant="link">
              <Link href="/dashboard/owner/agreements">{tDash("viewAllAgreements")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
