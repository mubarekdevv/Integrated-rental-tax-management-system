import { addDays, differenceInCalendarMonths } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { getActiveTaxRule, getSystemConfig } from "@/lib/services/config";
import { writeAuditLog } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";

const DEFAULT_TAX_GRACE_DAYS = 30;

export interface AssessTaxInput {
  agreementId: string;
  periodStart: Date;
  periodEnd: Date;
  actorId: string;
}

/**
 * Assessment assumption (see docs/ASSUMPTIONS.md): the rental amount on the
 * agreement is treated as a monthly figure; the taxable amount for a period
 * is monthly rent x number of months in that period, taxed at the currently
 * active TaxRule rate (11.5% by default in seed data, not hard-coded here).
 */
export async function assessTax(input: AssessTaxInput) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({ where: { id: input.agreementId } });
  const taxRule = await getActiveTaxRule(input.periodEnd);
  const graceDays = await getSystemConfig("TAX_PAYMENT_GRACE_DAYS", DEFAULT_TAX_GRACE_DAYS);

  const months = Math.max(1, differenceInCalendarMonths(input.periodEnd, input.periodStart));
  const taxableAmountEtb = Number(agreement.rentalAmountEtb) * months;
  const rateApplied = Number(taxRule.ratePercentage);
  const taxAmountEtb = Math.round(taxableAmountEtb * (rateApplied / 100) * 100) / 100;

  const assessment = await prisma.$transaction(async (tx) => {
    const created = await tx.taxAssessment.create({
      data: {
        agreementId: input.agreementId,
        taxRuleId: taxRule.id,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        taxableAmountEtb,
        rateApplied,
        taxAmountEtb,
        status: "ASSESSED",
        dueDate: addDays(input.periodEnd, graceDays),
        assessedById: input.actorId,
        assessedAt: new Date(),
      },
    });

    const property = await tx.property.findUnique({
      where: { id: agreement.propertyId },
      include: { ownerships: { include: { ownerProfile: true } } },
    });
    const ownerUserId = property?.ownerships.find((o) => o.isPrimaryContact)?.ownerProfile.userId;

    if (ownerUserId) {
      await createNotification({
        userId: ownerUserId,
        type: "TAX_DUE",
        title: "New tax assessment",
        message: `A tax of ${taxAmountEtb} ETB has been assessed for agreement ${agreement.agreementNumber}, due ${created.dueDate.toDateString()}.`,
        agreementId: agreement.id,
        tx,
      });
    }

    await writeAuditLog({
      actorId: input.actorId,
      action: "TAX_ASSESSED",
      entityType: "TaxAssessment",
      entityId: created.id,
      newValue: { taxAmountEtb, rateApplied },
      tx,
    });

    return created;
  });

  return assessment;
}

export async function markOverdueAssessments() {
  const now = new Date();
  const result = await prisma.taxAssessment.updateMany({
    where: { status: "ASSESSED", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
  return result.count;
}
