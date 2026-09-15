import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

export default async function HousingAgreementsPage() {
  const agreements = await prisma.rentalAgreement.findMany({
    orderBy: { createdAt: "desc" },
    include: { property: true, tenant: { include: { user: true } } },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Agreement Reviews</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement #</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
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
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/housing/agreements/${a.id}`}>Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
