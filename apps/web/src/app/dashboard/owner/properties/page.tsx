import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { SubmitPropertyButton } from "@/components/property/submit-property-button";

export default async function OwnerPropertiesPage() {
  const session = await auth();
  const [ownerProfile, t, tCommon] = await Promise.all([
    prisma.ownerProfile.findUnique({ where: { userId: session!.user.id } }),
    getTranslations("property"),
    getTranslations("common"),
  ]);
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
        <h1 className="text-xl font-semibold">{t("myProperties")}</h1>
        <Button asChild>
          <Link href="/dashboard/owner/properties/new">{t("registerNew")}</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("allPropertiesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPropertiesYet")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("code")}</TableHead>
                    <TableHead>{t("propertyTitle")}</TableHead>
                    <TableHead>{t("subCity")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                    <TableHead className="text-right">{tCommon("actions")}</TableHead>
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
                          <Link href={`/dashboard/owner/properties/${p.id}`}>{tCommon("view")}</Link>
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
