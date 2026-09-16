import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { SubmitPropertyButton } from "@/components/property/submit-property-button";

export default async function OwnerPropertyDetailPage({ params }: PageProps<"/dashboard/owner/properties/[id]">) {
  const { id } = await params;
  const session = await auth();
  const [property, t, tEnumProperty, tEnumConstruction, tEnumFurnished, tEnumOwnership] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        subCity: true,
        woreda: true,
        documents: true,
        ownerships: { include: { ownerProfile: true } },
        reviews: { orderBy: { createdAt: "desc" }, include: { reviewer: true } },
      },
    }),
    getTranslations("property"),
    getTranslations("enums.propertyType"),
    getTranslations("enums.constructionType"),
    getTranslations("enums.furnishedStatus"),
    getTranslations("enums.ownershipType"),
  ]);
  if (!property) notFound();

  const isOwner = property.ownerships.some(
    (o) => o.isPrimaryContact && o.ownerProfile.userId === session!.user.id
  );
  if (!isOwner) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={property.title}
        breadcrumbs={[
          { label: t("myProperties"), href: "/dashboard/owner/properties" },
          { label: property.code },
        ]}
        actions={<StatusBadge status={property.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label={t("propertyType")} value={tEnumProperty(property.propertyType)} />
          <Field label={t("constructionType")} value={tEnumConstruction(property.constructionType)} />
          <Field label={t("rooms")} value={String(property.numberOfRooms)} />
          <Field label={t("furnished")} value={tEnumFurnished(property.furnishedStatus)} />
          <Field label={t("subCity")} value={property.subCity.name} />
          <Field label={t("woreda")} value={property.woreda?.number ?? "-"} />
          <Field label={t("houseNumber")} value={property.houseNumber} />
          <Field label={t("askingRent")} value={`${Number(property.askingRentEtb).toLocaleString()} ETB ${t("perMonth")}`} />
          {property.description && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">{t("description")}</p>
              <p>{property.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("ownershipTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {property.ownerships.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-md border p-2">
              <span>
                {tEnumOwnership(o.ownershipType)}
                {o.sharePercentage ? ` — ${Number(o.sharePercentage)}%` : ""}
              </span>
              {o.isPrimaryContact && <span className="text-xs text-muted-foreground">{t("primaryContact")}</span>}
            </div>
          ))}
        </CardContent>
      </Card>

      {property.reviewComment && (
        <Card>
          <CardHeader>
            <CardTitle>{t("latestReviewComment")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{property.reviewComment}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("reviewHistoryTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {property.reviews.length === 0 && <p className="text-muted-foreground">{t("noReviewActivity")}</p>}
          {property.reviews.map((r) => (
            <div key={r.id} className="border-b pb-2 last:border-0">
              <p className="font-medium">
                {r.action.replaceAll("_", " ")} {t("byOwner", { ownerName: `${r.reviewer.firstName} ${r.reviewer.lastName}` })}
              </p>
              {r.comment && <p className="text-muted-foreground">{r.comment}</p>}
              <p className="text-xs text-muted-foreground">{r.createdAt.toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(property.status === "DRAFT" || property.status === "CORRECTION_REQUIRED") && (
          <SubmitPropertyButton propertyId={property.id} />
        )}
        {(property.status === "APPROVED" || property.status === "ACTIVE") && (
          <Button asChild>
            <Link href={`/dashboard/owner/agreements/new?propertyId=${property.id}`}>{t("createAgreementCta")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
