import { z } from "zod";

export const propertyTypeEnum = z.enum(["APARTMENT", "CONDOMINIUM", "SHARED_HOUSE", "VILLA", "COMMERCIAL", "OTHER"]);
export const constructionTypeEnum = z.enum(["CONCRETE", "HOLLOW_BLOCK", "WOOD_AND_MUD", "PREFAB", "OTHER"]);
export const furnishedStatusEnum = z.enum(["FURNISHED", "UNFURNISHED", "SEMI_FURNISHED"]);

export const propertySchema = z.object({
  title: z.string().min(3, "Title is required."),
  description: z.string().optional(),
  propertyType: propertyTypeEnum,
  constructionType: constructionTypeEnum,
  numberOfRooms: z.coerce.number().int().min(1).max(50),
  furnishedStatus: furnishedStatusEnum,
  sizeSqm: z.coerce.number().min(0).optional(),
  subCityId: z.coerce.number().int().positive("Select a sub-city."),
  woredaId: z.coerce.number().int().positive().optional(),
  houseNumber: z.string().min(1, "House number is required."),
  askingRentEtb: z.coerce.number().positive("Asking rent must be greater than zero."),
});

export type PropertyInput = z.infer<typeof propertySchema>;
