import { prisma } from "@/lib/db/prisma";
import type { ConstructionType, FurnishedStatus, PropertyType } from "@/generated/prisma/enums";

export interface PropertySearchFilters {
  subCityId?: number;
  propertyType?: PropertyType;
  constructionType?: ConstructionType;
  furnishedStatus?: FurnishedStatus;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
}

/** Only APPROVED, listed properties are "available" — ACTIVE means currently occupied. */
export async function searchProperties(filters: PropertySearchFilters) {
  return prisma.property.findMany({
    where: {
      isListed: true,
      status: "APPROVED",
      subCityId: filters.subCityId,
      propertyType: filters.propertyType,
      constructionType: filters.constructionType,
      furnishedStatus: filters.furnishedStatus,
      numberOfRooms: filters.minRooms ? { gte: filters.minRooms } : undefined,
      askingRentEtb: {
        gte: filters.minPrice,
        lte: filters.maxPrice,
      },
    },
    include: { subCity: true },
    orderBy: { createdAt: "desc" },
  });
}
