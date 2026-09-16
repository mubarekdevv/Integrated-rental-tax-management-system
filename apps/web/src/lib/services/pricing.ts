import { prisma } from "@/lib/db/prisma";
import type { Property } from "@/generated/prisma/client";

export interface PriceCheckResult {
  ruleId: string | null;
  flagged: boolean;
  reason: string | null;
}

/**
 * Compares a proposed rental amount against the configured expected range for
 * the property's sub-city / type / construction / room count / furnishing.
 * Sample ranges only — see docs/ASSUMPTIONS.md — not a legal price table.
 */
export async function checkRentalPrice(
  property: Property,
  proposedRentEtb: number
): Promise<PriceCheckResult> {
  // The rule set is seed-sized (dozens of rows at most), so filtering in
  // memory is simpler and clearer than a deeply nested Prisma `where`.
  const rules = await prisma.rentalPriceRule.findMany({ where: { isActive: true } });

  const matching = rules.filter((rule) => {
    if (rule.subCityId !== null && rule.subCityId !== property.subCityId) return false;
    if (rule.propertyType !== null && rule.propertyType !== property.propertyType) return false;
    if (rule.constructionType !== null && rule.constructionType !== property.constructionType) return false;
    if (rule.furnishedStatus !== null && rule.furnishedStatus !== property.furnishedStatus) return false;
    if (rule.minRooms !== null && property.numberOfRooms < rule.minRooms) return false;
    if (rule.maxRooms !== null && property.numberOfRooms > rule.maxRooms) return false;
    return true;
  });

  // Prefer the most specific rule (most non-null fields).
  const specificity = (r: (typeof rules)[number]) =>
    [r.subCityId, r.propertyType, r.constructionType, r.furnishedStatus, r.minRooms, r.maxRooms].filter(
      (v) => v !== null
    ).length;

  matching.sort((a, b) => specificity(b) - specificity(a));
  const rule = matching[0];

  if (!rule) {
    return { ruleId: null, flagged: false, reason: null };
  }

  const min = Number(rule.minPriceEtb);
  const max = Number(rule.maxPriceEtb);
  if (proposedRentEtb < min || proposedRentEtb > max) {
    return {
      ruleId: rule.id,
      flagged: true,
      reason: `Declared rent ${proposedRentEtb} ETB is outside the expected range (${min}-${max} ETB) for "${rule.label}".`,
    };
  }

  return { ruleId: rule.id, flagged: false, reason: null };
}
