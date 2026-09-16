import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function HousingTerminationsPage() {
  const requests = await prisma.rentalAgreement.findMany({
    where: { status: "ACTIVE", terminationRequestedById: { not: null } },
    include: { property: true, tenant: { include: { user: true } }, terminationRequestedBy: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Termination Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Terminations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No pending termination requests.</p>}
          {requests.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{a.property.title}</p>
                <p className="text-xs text-muted-foreground">
                  Requested by {a.terminationRequestedBy?.firstName} {a.terminationRequestedBy?.lastName}: {a.terminationReason}
                </p>
              </div>
              <Button asChild size="sm">
                <Link href={`/dashboard/housing/agreements/${a.id}`}>Review</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
