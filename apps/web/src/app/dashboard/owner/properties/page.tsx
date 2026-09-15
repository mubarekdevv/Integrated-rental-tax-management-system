import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SubmitPropertyButton } from "@/components/property/submit-property-button";

export default async function OwnerPropertiesPage() {
  const session = await auth();
  const ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: session!.user.id } });
  const properties = ownerProfile
    ? await prisma.property.findMany({
        where: { ownerships: { some: { ownerProfileId: ownerProfile.id } } },
        orderBy: { createdAt: "desc" },
        include: { subCity: true },
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Properties</h1>
        <Button asChild>
          <Link href="/dashboard/owner/properties/new">Register Property</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No properties yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Sub-city</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.subCity.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        {(p.status === "DRAFT" || p.status === "CORRECTION_REQUIRED") && (
                          <SubmitPropertyButton propertyId={p.id} />
                        )}
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
        </CardContent>
      </Card>
    </div>
  );
}
