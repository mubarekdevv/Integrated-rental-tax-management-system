import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";
import type {
  ConstructionType,
  FurnishedStatus,
  PenaltyCalculationType,
  PenaltyReasonCode,
  PropertyType,
} from "@/generated/prisma/enums";

export interface CreateTaxRuleBracketInput {
  minAmountEtb: number;
  maxAmountEtb: number | null;
  ratePercentage: number;
}

export interface CreateTaxRuleInput {
  name: string;
  brackets: CreateTaxRuleBracketInput[];
  effectiveFrom: Date;
  actorId: string;
}

/** Deactivates the currently active rule (if any) and creates a new one with
 * its own bracket set, so there is always exactly one active progressive
 * rate table and old tables stay on record for historical assessments. */
export async function createTaxRule(input: CreateTaxRuleInput) {
  if (input.brackets.length === 0) {
    throw new Error("At least one tax bracket is required.");
  }
  return prisma.$transaction(async (tx) => {
    await tx.taxRule.updateMany({ where: { isActive: true }, data: { isActive: false, effectiveTo: input.effectiveFrom } });
    const rule = await tx.taxRule.create({
      data: {
        name: input.name,
        effectiveFrom: input.effectiveFrom,
        isActive: true,
        createdById: input.actorId,
        brackets: {
          create: input.brackets.map((b, i) => ({
            minAmountEtb: b.minAmountEtb,
            maxAmountEtb: b.maxAmountEtb,
            ratePercentage: b.ratePercentage,
            sortOrder: i,
          })),
        },
      },
      include: { brackets: true },
    });
    await writeAuditLog({
      actorId: input.actorId,
      action: "TAX_RULE_CREATED",
      entityType: "TaxRule",
      entityId: rule.id,
      newValue: { brackets: input.brackets },
      tx,
    });
    return rule;
  });
}

export interface CreatePenaltyRuleInput {
  name: string;
  reasonCode: PenaltyReasonCode;
  calculationType: PenaltyCalculationType;
  fixedAmountEtb?: number;
  percentage?: number;
  perDayAmountEtb?: number;
  actorId: string;
}

export async function createPenaltyRule(input: CreatePenaltyRuleInput) {
  return prisma.penaltyRule.create({
    data: {
      name: input.name,
      reasonCode: input.reasonCode,
      calculationType: input.calculationType,
      fixedAmountEtb: input.fixedAmountEtb,
      percentage: input.percentage,
      perDayAmountEtb: input.perDayAmountEtb,
      createdById: input.actorId,
    },
  });
}

export interface CreateRentalPriceRuleInput {
  label: string;
  subCityId?: number;
  propertyType?: PropertyType;
  constructionType?: ConstructionType;
  furnishedStatus?: FurnishedStatus;
  minRooms?: number;
  maxRooms?: number;
  minPriceEtb: number;
  maxPriceEtb: number;
  actorId: string;
}

export async function createRentalPriceRule(input: CreateRentalPriceRuleInput) {
  return prisma.rentalPriceRule.create({
    data: {
      label: input.label,
      subCityId: input.subCityId,
      propertyType: input.propertyType,
      constructionType: input.constructionType,
      furnishedStatus: input.furnishedStatus,
      minRooms: input.minRooms,
      maxRooms: input.maxRooms,
      minPriceEtb: input.minPriceEtb,
      maxPriceEtb: input.maxPriceEtb,
      createdById: input.actorId,
    },
  });
}

export async function toggleUserActive(userId: string, actorId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  await writeAuditLog({
    actorId,
    action: updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entityType: "User",
    entityId: userId,
    previousValue: { isActive: user.isActive },
    newValue: { isActive: updated.isActive },
  });
  return updated;
}
