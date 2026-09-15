import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function TenantAgreementsPage() {
  const session = await auth();
  const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId: session!.user.id } });
  const agreements = tenantProfile
    ? await prisma.rentalAgreement.findMany({
        where: { tenantId: tenantProfile.id },
        orderBy: { createdAt: "desc" },
        include: { property: { include: { subCity: true } } },
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Agreements</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Agreements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {agreements.length === 0 && <p className="text-sm text-muted-foreground">No agreements yet.</p>}
          {agreements.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/tenant/agreements/${a.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
            >
              <div>
                <p className="font-medium">{a.property.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.property.subCity.name} &middot; {Number(a.rentalAmountEtb).toLocaleString()} ETB
                </p>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
