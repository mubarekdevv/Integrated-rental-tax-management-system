import Link from "next/link";
import { Home, FileText, Clock, Receipt } from "lucide-react";
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
  const data = await getOwnerDashboard(session!.user.id);

  if (!data.profileComplete) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert>
          <AlertTitle>Complete your owner profile</AlertTitle>
          <AlertDescription>
            Before you can register a property, please provide your identity details.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/owner/profile">Complete profile</Link>
        </Button>
      </div>
    );
  }

  const { properties, agreements, stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${session!.user.firstName}`}
        description="Here is an overview of your properties and agreements."
        actions={
          <Button asChild>
            <Link href="/dashboard/owner/properties/new">Register Property</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={stats.totalProperties} icon={Home} />
        <StatCard label="Active Agreements" value={stats.activeAgreements} icon={FileText} />
        <StatCard label="Pending Review" value={stats.pendingReview} icon={Clock} />
        <StatCard label="Unpaid Tax Items" value={stats.unpaidTax} icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven&apos;t registered a property yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Sub-city</TableHead>
                    <TableHead>Asking Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <Link href={`/dashboard/owner/properties/${p.id}`}>View</Link>
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
              <Link href="/dashboard/owner/properties">View all properties</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rental agreements yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agreement #</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <Link href={`/dashboard/owner/agreements/${a.id}`}>View</Link>
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
              <Link href="/dashboard/owner/agreements">View all agreements</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
