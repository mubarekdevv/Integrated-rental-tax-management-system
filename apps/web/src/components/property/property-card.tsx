import Link from "next/link";
import { BedDouble, MapPin } from "lucide-react";
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

export function PropertyCard({ property }: { property: PropertyCardData }) {
  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{property.title}</h3>
            <Badge variant="outline">{property.propertyType.replaceAll("_", " ")}</Badge>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {property.subCity.name}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <BedDouble className="size-3.5" /> {property.numberOfRooms} room{property.numberOfRooms > 1 ? "s" : ""} &middot;{" "}
            {property.furnishedStatus.replaceAll("_", " ")}
          </p>
          <p className="text-lg font-semibold text-primary">
            {property.askingRentEtb.toLocaleString()} ETB <span className="text-sm font-normal text-muted-foreground">/ month</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
