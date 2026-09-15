import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { SubmitPropertyButton } from "@/components/property/submit-property-button";

export default async function OwnerPropertyDetailPage({ params }: PageProps<"/dashboard/owner/properties/[id]">) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: { subCity: true, woreda: true, documents: true, reviews: { orderBy: { createdAt: "desc" }, include: { reviewer: true } } },
  });
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{property.title}</h1>
          <p className="font-mono text-xs text-muted-foreground">{property.code}</p>
        </div>
        <StatusBadge status={property.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="Property Type" value={property.propertyType.replaceAll("_", " ")} />
          <Field label="Construction Type" value={property.constructionType.replaceAll("_", " ")} />
          <Field label="Rooms" value={String(property.numberOfRooms)} />
          <Field label="Furnished" value={property.furnishedStatus.replaceAll("_", " ")} />
          <Field label="Sub-city" value={property.subCity.name} />
          <Field label="Woreda" value={property.woreda?.number ?? "-"} />
          <Field label="House Number" value={property.houseNumber} />
          <Field label="Asking Rent" value={`${Number(property.askingRentEtb).toLocaleString()} ETB / month`} />
          {property.description && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Description</p>
              <p>{property.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {property.reviewComment && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Review Comment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{property.reviewComment}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {property.reviews.length === 0 && <p className="text-muted-foreground">No review activity yet.</p>}
          {property.reviews.map((r) => (
            <div key={r.id} className="border-b pb-2 last:border-0">
              <p className="font-medium">
                {r.action.replaceAll("_", " ")} by {r.reviewer.firstName} {r.reviewer.lastName}
              </p>
              {r.comment && <p className="text-muted-foreground">{r.comment}</p>}
              <p className="text-xs text-muted-foreground">{r.createdAt.toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {(property.status === "DRAFT" || property.status === "CORRECTION_REQUIRED") && (
          <SubmitPropertyButton propertyId={property.id} />
        )}
        {(property.status === "APPROVED" || property.status === "ACTIVE") && (
          <Button asChild>
            <Link href={`/dashboard/owner/agreements/new?propertyId=${property.id}`}>Create Rental Agreement</Link>
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
