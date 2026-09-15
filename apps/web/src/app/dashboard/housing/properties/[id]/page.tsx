import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReviewPropertyButtons } from "@/components/property/review-property-buttons";

export default async function HousingPropertyDetailPage({ params }: PageProps<"/dashboard/housing/properties/[id]">) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      subCity: true,
      woreda: true,
      documents: true,
      reviews: { orderBy: { createdAt: "desc" }, include: { reviewer: true } },
      ownerships: { include: { ownerProfile: { include: { user: true } } } },
    },
  });
  if (!property) notFound();

  const primaryOwner = property.ownerships.find((o) => o.isPrimaryContact)?.ownerProfile;
  const canReview = ["SUBMITTED", "UNDER_REVIEW"].includes(property.status);

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
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          {primaryOwner ? (
            <>
              <Field label="Name" value={`${primaryOwner.user.firstName} ${primaryOwner.user.lastName}`} />
              <Field label="Phone" value={primaryOwner.user.phone} />
              <Field label="ID" value={`${primaryOwner.idType.replaceAll("_", " ")} - ${primaryOwner.idNumber}`} />
              <Field label="Verified" value={primaryOwner.isVerified ? "Yes" : "No"} />
            </>
          ) : (
            <p className="text-muted-foreground">No primary owner on record.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="Property Type" value={property.propertyType.replaceAll("_", " ")} />
          <Field label="Construction Type" value={property.constructionType.replaceAll("_", " ")} />
          <Field label="Rooms" value={String(property.numberOfRooms)} />
          <Field label="Furnished" value={property.furnishedStatus.replaceAll("_", " ")} />
          <Field label="Sub-city" value={property.subCity.name} />
          <Field label="House Number" value={property.houseNumber} />
          <Field label="Asking Rent" value={`${Number(property.askingRentEtb).toLocaleString()} ETB / month`} />
        </CardContent>
      </Card>

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
            </div>
          ))}
        </CardContent>
      </Card>

      {canReview && <ReviewPropertyButtons propertyId={property.id} />}
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
