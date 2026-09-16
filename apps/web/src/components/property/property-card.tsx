import Link from "next/link";
import { BedDouble, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PropertyCardData {
  id: string;
  title: string;
  propertyType: string;
  numberOfRooms: number;
  furnishedStatus: string;
  askingRentEtb: number;
  subCity: { name: string };
}

export async function PropertyCard({ property }: { property: PropertyCardData }) {
  const [t, tEnumProperty, tEnumFurnished] = await Promise.all([
    getTranslations("property"),
    getTranslations("enums.propertyType"),
    getTranslations("enums.furnishedStatus"),
  ]);

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{property.title}</h3>
            <Badge variant="outline">{tEnumProperty(property.propertyType)}</Badge>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {property.subCity.name}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <BedDouble className="size-3.5" /> {t("roomsCount", { count: property.numberOfRooms })} &middot;{" "}
            {tEnumFurnished(property.furnishedStatus)}
          </p>
          <p className="text-lg font-semibold text-primary">
            {property.askingRentEtb.toLocaleString()} ETB <span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
