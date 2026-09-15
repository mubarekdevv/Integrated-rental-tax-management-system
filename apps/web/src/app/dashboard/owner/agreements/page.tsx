import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function OwnerAgreementsPage() {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Agreements</h1>
        <Button asChild>
          <Link href="/dashboard/owner/agreements/new">New Agreement</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agreements yet.</p>
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
                  {agreements.map((a) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
