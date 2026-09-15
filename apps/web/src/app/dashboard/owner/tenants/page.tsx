import Link from "next/link";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function OwnerTenantsPage() {
  const session = await auth();
  const ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: session!.user.id } });

  const agreements = ownerProfile
    ? await prisma.rentalAgreement.findMany({
        where: { property: { ownerships: { some: { ownerProfileId: ownerProfile.id } } } },
        orderBy: { createdAt: "desc" },
        include: { property: true, tenant: { include: { user: true } } },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="My Tenants & Rentals"
        description="Everyone renting one of your properties, current and past."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/owner/tenants/new">Register a Tenant</Link>
          </Button>
        }
      />
      {agreements.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants yet"
          description="Once you create a rental agreement, your tenant will appear here."
          action={
            <Button asChild size="sm" className="mt-2">
              <Link href="/dashboard/owner/agreements/new">Create an Agreement</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.tenant.user.firstName} {a.tenant.user.lastName}
                      </TableCell>
                      <TableCell>{a.tenant.user.phone}</TableCell>
                      <TableCell>{a.property.title}</TableCell>
                      <TableCell>{Number(a.rentalAmountEtb).toLocaleString()} ETB</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/owner/agreements/${a.id}`}>View Agreement</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
