import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, BedDouble, Ruler, Building2 } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { PublicHeader } from "@/components/shared/public-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function PropertyDetailPage({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const [property, session] = await Promise.all([
    prisma.property.findFirst({
      where: { id, isListed: true, status: "APPROVED" },
      include: { subCity: true, woreda: true },
    }),
    auth(),
  ]);
  if (!property) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold">{property.title}</h1>
            <Badge variant="outline">{property.propertyType.replaceAll("_", " ")}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" /> {property.subCity.name}
            {property.woreda ? `, Woreda ${property.woreda.number}` : ""}
          </p>
        </div>

        <p className="text-3xl font-bold text-primary">
          {Number(property.askingRentEtb).toLocaleString()} ETB
          <span className="text-base font-normal text-muted-foreground"> / month</span>
        </p>

        {property.description && <p className="text-muted-foreground">{property.description}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Detail icon={BedDouble} label="Rooms" value={String(property.numberOfRooms)} />
            <Detail icon={Building2} label="Construction" value={property.constructionType.replaceAll("_", " ")} />
            <Detail icon={Ruler} label="Size" value={property.sizeSqm ? `${property.sizeSqm} sqm` : "N/A"} />
            <Detail icon={Building2} label="Furnished" value={property.furnishedStatus.replaceAll("_", " ")} />
          </CardContent>
        </Card>

        <Alert>
          <AlertTitle>Interested in this property?</AlertTitle>
          <AlertDescription>
            Rental agreements are arranged through the property owner and finalized with the housing office. Log in
            or register as a tenant, then contact the owner to proceed.
          </AlertDescription>
        </Alert>

        {!session?.user && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/register">Register as Tenant</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
