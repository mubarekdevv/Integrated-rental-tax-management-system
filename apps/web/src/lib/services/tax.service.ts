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

export interface TaxBracketLike {
  minAmountEtb: number;
  maxAmountEtb: number | null;
  ratePercentage: number;
  sortOrder: number;
}

export interface TaxBracketBreakdownRow {
  minAmountEtb: number;
  maxAmountEtb: number | null;
  ratePercentage: number;
  amountInBracketEtb: number;
  taxForBracketEtb: number;
}

/**
 * Ethiopian rental-income tax is progressive (PwC Worldwide Tax Summaries —
 * Ethiopia, individual rental income tax; see docs/ASSUMPTIONS.md), NOT a
 * flat rate: each bracket's rate applies only to the slice of taxable
 * income that falls within that bracket, exactly like marginal income-tax
 * brackets. This is a pure function (no DB access) so it can be unit-tested
 * directly — see scripts/verify-tax-calculation.ts.
 */
export function calculateProgressiveTax(
  taxableAmountEtb: number,
  brackets: TaxBracketLike[]
): { taxAmountEtb: number; breakdown: TaxBracketBreakdownRow[] } {
  if (!Number.isFinite(taxableAmountEtb) || taxableAmountEtb < 0) {
    throw new Error(`Invalid taxable amount: ${taxableAmountEtb}`);
  }
  if (brackets.length === 0) {
    throw new Error("No tax brackets configured for the active tax rule.");
  }

  const sorted = [...brackets].sort((a, b) => a.sortOrder - b.sortOrder);
  let totalTax = 0;
  const breakdown: TaxBracketBreakdownRow[] = [];

  for (const bracket of sorted) {
    const min = bracket.minAmountEtb;
    const max = bracket.maxAmountEtb ?? Infinity;
    if (taxableAmountEtb <= min) break;

    const amountInBracketEtb = Math.round((Math.min(taxableAmountEtb, max) - min) * 100) / 100;
    if (amountInBracketEtb <= 0) continue;

    const taxForBracketEtb = Math.round(amountInBracketEtb * (bracket.ratePercentage / 100) * 100) / 100;
    totalTax += taxForBracketEtb;
    breakdown.push({
      minAmountEtb: min,
      maxAmountEtb: bracket.maxAmountEtb,
      ratePercentage: bracket.ratePercentage,
      amountInBracketEtb,
      taxForBracketEtb,
    });
  }

  return { taxAmountEtb: Math.round(totalTax * 100) / 100, breakdown };
}

/**
 * Assessment assumption (see docs/ASSUMPTIONS.md): the rental amount on the
 * agreement is treated as a monthly figure; the taxable amount for a period
 * is monthly rent x number of months in that period. That amount is then
 * taxed progressively against the currently active TaxRule's brackets
 * (never a single flat rate hard-coded here).
 */
export async function assessTax(input: AssessTaxInput) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({ where: { id: input.agreementId } });
  const taxRule = await getActiveTaxRule(input.periodEnd);
  const graceDays = await getSystemConfig("TAX_PAYMENT_GRACE_DAYS", DEFAULT_TAX_GRACE_DAYS);

  const months = Math.max(1, differenceInCalendarMonths(input.periodEnd, input.periodStart));
  const taxableAmountEtb = Number(agreement.rentalAmountEtb) * months;

  const { taxAmountEtb, breakdown } = calculateProgressiveTax(
    taxableAmountEtb,
    taxRule.brackets.map((b) => ({
      minAmountEtb: Number(b.minAmountEtb),
      maxAmountEtb: b.maxAmountEtb != null ? Number(b.maxAmountEtb) : null,
      ratePercentage: Number(b.ratePercentage),
      sortOrder: b.sortOrder,
    }))
  );
  // Effective/blended rate, for display only — see the schema comment on
  // TaxAssessment.rateApplied. The real calculation is `breakdown`.
  const rateApplied = taxableAmountEtb > 0 ? Math.round((taxAmountEtb / taxableAmountEtb) * 10000) / 100 : 0;

  const assessment = await prisma.$transaction(async (tx) => {
    const created = await tx.taxAssessment.create({
      data: {
        agreementId: input.agreementId,
        taxRuleId: taxRule.id,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        taxableAmountEtb,
        rateApplied,
        bracketBreakdown: JSON.parse(JSON.stringify(breakdown)),
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
