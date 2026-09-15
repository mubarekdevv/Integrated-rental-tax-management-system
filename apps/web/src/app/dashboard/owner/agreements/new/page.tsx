import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NewAgreementForm } from "./new-agreement-form";

export default async function NewAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
  const session = await auth();
  const ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: session!.user.id } });

  const properties = ownerProfile
    ? await prisma.property.findMany({
        where: {
          ownerships: { some: { ownerProfileId: ownerProfile.id } },
          status: { in: ["APPROVED", "ACTIVE"] },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a Rental Agreement</CardTitle>
          <CardDescription>
            Select an approved property and a tenant.{" "}
            <Link href="/dashboard/owner/tenants/new" className="underline">
              Register a new tenant
            </Link>{" "}
            if they don&apos;t have an account yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any approved properties yet.{" "}
              <Link href="/dashboard/owner/properties" className="underline">
                View my properties
              </Link>
              .
            </p>
          ) : (
            <NewAgreementForm
              properties={properties.map((p) => ({ id: p.id, title: p.title, code: p.code, askingRentEtb: Number(p.askingRentEtb) }))}
              defaultPropertyId={propertyId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
