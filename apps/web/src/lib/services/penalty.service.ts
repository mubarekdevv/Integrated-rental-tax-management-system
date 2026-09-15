import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";

export interface CreatePenaltyInput {
  penaltyRuleId: string;
  responsiblePartyId: string;
  reason: string;
  delayDays?: number;
  baseAmountEtb?: number; // used for PERCENTAGE_OF_RENT rules
  agreementId?: string;
  propertyId?: string;
  taxAssessmentId?: string;
  evidenceNote?: string;
  createdById: string;
}

function calculateAmount(
  rule: { calculationType: string; fixedAmountEtb: unknown; percentage: unknown; perDayAmountEtb: unknown },
  delayDays: number | undefined,
  baseAmountEtb: number | undefined
) {
  switch (rule.calculationType) {
    case "FIXED":
      return Number(rule.fixedAmountEtb ?? 0);
    case "PERCENTAGE_OF_RENT":
      return Math.round(Number(baseAmountEtb ?? 0) * (Number(rule.percentage ?? 0) / 100) * 100) / 100;
    case "PER_DAY_LATE":
      return Number(rule.perDayAmountEtb ?? 0) * (delayDays ?? 0);
    default:
      return 0;
  }
}

export async function createPenalty(input: CreatePenaltyInput) {
  const rule = await prisma.penaltyRule.findUniqueOrThrow({ where: { id: input.penaltyRuleId } });
  const calculatedAmountEtb = calculateAmount(rule, input.delayDays, input.baseAmountEtb);

  const penalty = await prisma.$transaction(async (tx) => {
    const created = await tx.penalty.create({
      data: {
        penaltyRuleId: input.penaltyRuleId,
        responsiblePartyId: input.responsiblePartyId,
        reason: input.reason,
        delayDays: input.delayDays,
        calculatedAmountEtb,
        agreementId: input.agreementId,
        propertyId: input.propertyId,
        taxAssessmentId: input.taxAssessmentId,
        evidenceNote: input.evidenceNote,
        status: "PENDING",
        createdById: input.createdById,
      },
    });

    await createNotification({
      userId: input.responsiblePartyId,
      type: "PENALTY",
      title: "New penalty recorded",
      message: `A penalty of ${calculatedAmountEtb} ETB was recorded: ${input.reason}`,
      agreementId: input.agreementId,
      tx,
    });

    await writeAuditLog({
      actorId: input.createdById,
      action: "PENALTY_CREATED",
      entityType: "Penalty",
      entityId: created.id,
      newValue: { calculatedAmountEtb, reason: input.reason },
      tx,
    });

    return created;
  });

  return penalty;
}

export type PenaltyDecision = "APPROVED" | "WAIVED" | "DISPUTED";

export async function reviewPenalty(penaltyId: string, officerId: string, decision: PenaltyDecision, note?: string) {
  const penalty = await prisma.penalty.findUniqueOrThrow({ where: { id: penaltyId } });
  if (!["PENDING", "UNDER_REVIEW"].includes(penalty.status)) {
    throw new Error(`Penalty in status ${penalty.status} cannot be reviewed.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.penalty.update({
      where: { id: penaltyId },
      data: {
        status: decision,
        reviewedById: officerId,
        reviewedAt: new Date(),
        approvedById: decision === "APPROVED" ? officerId : penalty.approvedById,
        approvedAt: decision === "APPROVED" ? new Date() : penalty.approvedAt,
      },
    });

    await writeAuditLog({
      actorId: officerId,
      action: `PENALTY_${decision}`,
      entityType: "Penalty",
      entityId: penaltyId,
      previousValue: { status: penalty.status },
      newValue: { status: decision, note },
      tx,
    });

    return updated;
  });
}
