import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";
import type {
  ConstructionType,
  FurnishedStatus,
  PenaltyCalculationType,
  PenaltyReasonCode,
  PropertyType,
} from "@/generated/prisma/enums";

export interface CreateTaxRuleInput {
  name: string;
  ratePercentage: number;
  effectiveFrom: Date;
  actorId: string;
}

/** Deactivates the currently active rule (if any) and creates a new one, so
 * there is always exactly one active rate and old rates stay on record. */
export async function createTaxRule(input: CreateTaxRuleInput) {
  return prisma.$transaction(async (tx) => {
    await tx.taxRule.updateMany({ where: { isActive: true }, data: { isActive: false, effectiveTo: input.effectiveFrom } });
    const rule = await tx.taxRule.create({
      data: {
        name: input.name,
        ratePercentage: input.ratePercentage,
        effectiveFrom: input.effectiveFrom,
        isActive: true,
        createdById: input.actorId,
      },
    });
    await writeAuditLog({
      actorId: input.actorId,
      action: "TAX_RULE_CREATED",
      entityType: "TaxRule",
      entityId: rule.id,
      newValue: { ratePercentage: input.ratePercentage },
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
