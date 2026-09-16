import { prisma } from "@/lib/db/prisma";
import { searchProperties } from "@/lib/services/property-search.service";
import { PublicHeader } from "@/components/shared/public-header";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyFilters } from "./property-filters";
import type { ConstructionType, FurnishedStatus, PropertyType } from "@/generated/prisma/enums";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [properties, subCities] = await Promise.all([
    searchProperties({
      subCityId: params.subCityId ? Number(params.subCityId) : undefined,
      propertyType: params.propertyType as PropertyType | undefined,
      constructionType: params.constructionType as ConstructionType | undefined,
      furnishedStatus: params.furnishedStatus as FurnishedStatus | undefined,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    }),
    prisma.subCity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold">Find a Home</h1>
          <p className="text-sm text-muted-foreground">{properties.length} approved listings available.</p>
        </div>
        <PropertyFilters subCities={subCities} />
        {properties.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No properties match your filters.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={{
                  id: p.id,
                  title: p.title,
                  propertyType: p.propertyType,
                  numberOfRooms: p.numberOfRooms,
                  furnishedStatus: p.furnishedStatus,
                  askingRentEtb: Number(p.askingRentEtb),
                  subCity: p.subCity,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
