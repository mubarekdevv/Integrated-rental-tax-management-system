import { differenceInCalendarMonths } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { checkRentalPrice } from "@/lib/services/pricing";
import { generateAgreementNumber, generateContractNumber, generateQrToken } from "@/lib/services/reference";
import { writeAuditLog } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";
import { getSystemConfig } from "@/lib/services/config";
import { assertOwnsProperty, assertPartyToAgreement } from "@/lib/auth/record-access";
import type { PaymentFrequency, UserRole } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

const DEFAULT_SERVICE_FEE_PERCENTAGE = 2; // % of the first year's rent, configurable via SystemConfiguration.

// ---------------------------------------------------------------------------
// RENTAL PRICE INCREASE REGULATION
//
// A separate rule from rental-income TAX (see tax.service.ts's
// TaxBracket/calculateProgressiveTax — that is a different concept and this
// value is never used there). As directed by the project owner for this
// prototype: an owner may not increase a tenant's rent until a 2-year
// (24-month) waiting period has elapsed since the rent was last set or
// changed, and even then the new rent may not exceed 11.5% above the
// current rent. This figure was supplied directly by the project owner as
// a requirement for this academic prototype, not independently verified
// against a specific proclamation article — see docs/ASSUMPTIONS.md.
// ---------------------------------------------------------------------------
export const RENT_INCREASE_WAITING_PERIOD_MONTHS = 24;
export const RENT_INCREASE_MAX_PERCENTAGE = 11.5;

export type RentIncreaseBlockReason = "TOO_SOON" | "EXCEEDS_MAX_PERCENTAGE";

export interface RentIncreaseCheckResult {
  allowed: boolean;
  reason?: RentIncreaseBlockReason;
  monthsSinceLastChange: number;
  monthsRemaining: number;
  maxAllowedRentEtb: number;
}

/**
 * Pure, DB-free rule check — see scripts/verify-rent-increase.ts. Only
 * restricts increases: a price decrease or an unchanged price is always
 * allowed, regardless of how long it has been.
 */
export function checkRentIncreaseAllowed(
  currentRentEtb: number,
  newRentEtb: number,
  lastPriceChangeDate: Date,
  now: Date = new Date()
): RentIncreaseCheckResult {
  if (!Number.isFinite(currentRentEtb) || currentRentEtb < 0) {
    throw new Error(`Invalid current rent amount: ${currentRentEtb}`);
  }
  if (!Number.isFinite(newRentEtb) || newRentEtb < 0) {
    throw new Error(`Invalid new rent amount: ${newRentEtb}`);
  }

  const maxAllowedRentEtb = Math.round(currentRentEtb * (1 + RENT_INCREASE_MAX_PERCENTAGE / 100) * 100) / 100;
  const monthsSinceLastChange = Math.max(0, differenceInCalendarMonths(now, lastPriceChangeDate));
  const monthsRemaining = Math.max(0, RENT_INCREASE_WAITING_PERIOD_MONTHS - monthsSinceLastChange);

  if (newRentEtb <= currentRentEtb) {
    return { allowed: true, monthsSinceLastChange, monthsRemaining: 0, maxAllowedRentEtb };
  }
  if (monthsSinceLastChange < RENT_INCREASE_WAITING_PERIOD_MONTHS) {
    return { allowed: false, reason: "TOO_SOON", monthsSinceLastChange, monthsRemaining, maxAllowedRentEtb };
  }
  if (newRentEtb > maxAllowedRentEtb) {
    return { allowed: false, reason: "EXCEEDS_MAX_PERCENTAGE", monthsSinceLastChange, monthsRemaining: 0, maxAllowedRentEtb };
  }
  return { allowed: true, monthsSinceLastChange, monthsRemaining: 0, maxAllowedRentEtb };
}

function rentIncreaseErrorMessage(result: RentIncreaseCheckResult): string {
  if (result.reason === "TOO_SOON") {
    return `Rent cannot be increased yet: the ${RENT_INCREASE_WAITING_PERIOD_MONTHS}-month waiting period has not elapsed (${result.monthsSinceLastChange} of ${RENT_INCREASE_WAITING_PERIOD_MONTHS} months so far, ${result.monthsRemaining} remaining).`;
  }
  return `Rent increase exceeds the permitted ${RENT_INCREASE_MAX_PERCENTAGE}% cap. Maximum allowed right now: ${result.maxAllowedRentEtb.toLocaleString()} ETB.`;
}

/** The date the current rent amount took effect: the most recent version
 * that actually set a price (CREATED, PRICE_UPDATED, or a RENEWED that
 * changed the rent), falling back to when the agreement was created. */
async function getLastPriceChangeDate(
  tx: Prisma.TransactionClient,
  agreementId: string,
  fallbackDate: Date
): Promise<Date> {
  const lastPriceVersion = await tx.agreementVersion.findFirst({
    where: { agreementId, changeType: { in: ["CREATED", "PRICE_UPDATED", "RENEWED"] } },
    orderBy: { versionNumber: "desc" },
  });
  return lastPriceVersion?.createdAt ?? fallbackDate;
}

export interface CreateAgreementInput {
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  rentalAmountEtb: number;
  paymentFrequency: PaymentFrequency;
  createdById: string;
}

export async function createAgreement(input: CreateAgreementInput) {
  await assertOwnsProperty(input.createdById, input.propertyId);

  const property = await prisma.property.findUniqueOrThrow({ where: { id: input.propertyId } });
  if (property.status !== "APPROVED" && property.status !== "ACTIVE") {
    throw new Error("The property must be approved by a housing officer before an agreement can be created.");
  }

  const priceCheck = await checkRentalPrice(property, input.rentalAmountEtb);
  const feePercentage = await getSystemConfig("SERVICE_FEE_PERCENTAGE", DEFAULT_SERVICE_FEE_PERCENTAGE);
  const serviceFeeAmountEtb = Math.round(input.rentalAmountEtb * (feePercentage / 100) * 100) / 100;

  const agreement = await prisma.$transaction(async (tx) => {
    const created = await tx.rentalAgreement.create({
      data: {
        agreementNumber: generateAgreementNumber(property.subCityId),
        propertyId: input.propertyId,
        tenantId: input.tenantId,
        startDate: input.startDate,
        endDate: input.endDate,
        rentalAmountEtb: input.rentalAmountEtb,
        paymentFrequency: input.paymentFrequency,
        furnishedStatus: property.furnishedStatus,
        status: "DRAFT",
        priceFlagged: priceCheck.flagged,
        priceFlagReason: priceCheck.reason,
        appliedPriceRuleId: priceCheck.ruleId,
        serviceFeeAmountEtb,
        createdById: input.createdById,
      },
    });

    await tx.agreementVersion.create({
      data: {
        agreementId: created.id,
        versionNumber: 1,
        changeType: "CREATED",
        rentalAmountEtb: created.rentalAmountEtb,
        startDate: created.startDate,
        endDate: created.endDate,
        status: created.status,
        changedById: input.createdById,
        snapshot: serializeAgreement(created),
      },
    });

    await writeAuditLog({
      actorId: input.createdById,
      action: "AGREEMENT_CREATED",
      entityType: "RentalAgreement",
      entityId: created.id,
      newValue: created,
      tx,
    });

    return created;
  });

  return agreement;
}

export async function submitAgreement(agreementId: string, actorUserId: string) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({ where: { id: agreementId } });
  if (agreement.createdById !== actorUserId) {
    throw new Error("Only the agreement creator can submit it for review.");
  }
  if (!["DRAFT", "CORRECTION_REQUIRED"].includes(agreement.status)) {
    throw new Error(`Agreement cannot be submitted from status ${agreement.status}.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.rentalAgreement.update({
      where: { id: agreementId },
      data: { status: "SUBMITTED" },
    });
    await tx.agreementReview.create({
      data: {
        agreementId,
        reviewerId: actorUserId,
        action: "SUBMITTED",
        previousStatus: agreement.status,
        newStatus: "SUBMITTED",
      },
    });
    await writeAuditLog({
      actorId: actorUserId,
      action: "AGREEMENT_SUBMITTED",
      entityType: "RentalAgreement",
      entityId: agreementId,
      previousValue: { status: agreement.status },
      newValue: { status: "SUBMITTED" },
      tx,
    });
    return updated;
  });
}

export type AgreementReviewDecision = "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED";

export async function reviewAgreement(
  agreementId: string,
  officerId: string,
  decision: AgreementReviewDecision,
  comment?: string
) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({
    where: { id: agreementId },
    include: { tenant: { include: { user: true } }, property: { include: { ownerships: { include: { ownerProfile: { include: { user: true } } } } } } },
  });

  if (!["SUBMITTED", "UNDER_REVIEW"].includes(agreement.status)) {
    throw new Error(`Agreement in status ${agreement.status} cannot be reviewed.`);
  }

  return prisma.$transaction(async (tx) => {
    let wulNumber: string | null = null;
    let wulQrToken: string | null = null;
    let wulIssuedAt: Date | null = null;

    if (decision === "APPROVED") {
      const feePaid = await tx.payment.findFirst({
        where: { agreementId, purpose: "SERVICE_FEE", status: "COMPLETED" },
      });
      if (!feePaid) {
        throw new Error("The service fee must be paid before the agreement can be approved.");
      }
      wulNumber = generateContractNumber(agreement.property.subCityId);
      wulQrToken = generateQrToken();
      wulIssuedAt = new Date();
    }

    // Approval and activation are the same moment in this workflow: once the
    // contract agreement is issued the tenancy is live, so the agreement
    // goes straight to ACTIVE rather than resting in an intermediate
    // APPROVED state.
    const newStatus = decision === "APPROVED" ? "ACTIVE" : decision;

    const updated = await tx.rentalAgreement.update({
      where: { id: agreementId },
      data: {
        status: newStatus,
        approvedById: decision === "APPROVED" ? officerId : agreement.approvedById,
        approvedAt: decision === "APPROVED" ? new Date() : agreement.approvedAt,
        wulNumber: wulNumber ?? undefined,
        wulQrToken: wulQrToken ?? undefined,
        wulIssuedAt: wulIssuedAt ?? undefined,
      },
    });

    if (decision === "APPROVED") {
      await tx.property.update({ where: { id: agreement.propertyId }, data: { status: "ACTIVE" } });
    }

    await tx.agreementReview.create({
      data: {
        agreementId,
        reviewerId: officerId,
        action: decision === "APPROVED" ? "APPROVED" : decision === "REJECTED" ? "REJECTED" : "CORRECTION_REQUESTED",
        comment,
        previousStatus: agreement.status,
        newStatus,
      },
    });

    const notifyUserIds = [
      agreement.tenant.userId,
      agreement.property.ownerships.find((o) => o.isPrimaryContact)?.ownerProfile.userId,
    ].filter((v): v is string => Boolean(v));

    for (const userId of notifyUserIds) {
      await createNotification({
        userId,
        type: decision === "APPROVED" ? "APPROVAL" : decision === "REJECTED" ? "REJECTION" : "CORRECTION_REQUIRED",
        title: `Rental agreement ${decision.toLowerCase().replace("_", " ")}`,
        message:
          comment ??
          `Agreement ${agreement.agreementNumber} is now ${decision.replace("_", " ").toLowerCase()}.`,
        agreementId,
        tx,
      });
    }

    await writeAuditLog({
      actorId: officerId,
      action: `AGREEMENT_${decision}`,
      entityType: "RentalAgreement",
      entityId: agreementId,
      previousValue: { status: agreement.status },
      newValue: { status: decision },
      tx,
    });

    return updated;
  });
}

export interface UpdateAgreementPriceInput {
  agreementId: string;
  newRentalAmountEtb: number;
  reason: string;
  actorUserId: string;
  actorRole: UserRole;
}

/** Records a price change as a new version, preserves history, re-checks the
 * configured price range, and re-flags for review when needed. */
export async function updateAgreementPrice(input: UpdateAgreementPriceInput) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({
    where: { id: input.agreementId },
    include: { property: true },
  });

  if (agreement.status !== "ACTIVE") {
    throw new Error("Only active agreements can have their price updated.");
  }
  if (input.actorRole !== "SUPER_ADMIN") {
    await assertOwnsProperty(input.actorUserId, agreement.propertyId);
  }

  const priceCheck = await checkRentalPrice(agreement.property, input.newRentalAmountEtb);

  return prisma.$transaction(async (tx) => {
    const lastVersion = await tx.agreementVersion.findFirst({
      where: { agreementId: input.agreementId },
      orderBy: { versionNumber: "desc" },
    });

    const lastPriceChangeDate = await getLastPriceChangeDate(tx, input.agreementId, agreement.createdAt);
    const increaseCheck = checkRentIncreaseAllowed(
      Number(agreement.rentalAmountEtb),
      input.newRentalAmountEtb,
      lastPriceChangeDate
    );
    if (!increaseCheck.allowed) {
      throw new Error(rentIncreaseErrorMessage(increaseCheck));
    }

    const updated = await tx.rentalAgreement.update({
      where: { id: input.agreementId },
      data: {
        rentalAmountEtb: input.newRentalAmountEtb,
        priceFlagged: priceCheck.flagged,
        priceFlagReason: priceCheck.reason,
        appliedPriceRuleId: priceCheck.ruleId,
      },
    });

    await tx.agreementVersion.create({
      data: {
        agreementId: input.agreementId,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        changeType: "PRICE_UPDATED",
        rentalAmountEtb: input.newRentalAmountEtb,
        startDate: agreement.startDate,
        endDate: agreement.endDate,
        status: agreement.status,
        changeReason: input.reason,
        changedById: input.actorUserId,
        snapshot: serializeAgreement(agreement),
      },
    });

    await writeAuditLog({
      actorId: input.actorUserId,
      action: "AGREEMENT_PRICE_UPDATED",
      entityType: "RentalAgreement",
      entityId: input.agreementId,
      previousValue: { rentalAmountEtb: agreement.rentalAmountEtb.toString() },
      newValue: { rentalAmountEtb: input.newRentalAmountEtb, reason: input.reason },
      tx,
    });

    // Tax is calculated from the agreement's rental amount, so the tax
    // authority needs to know when it changes.
    const taxOfficers = await tx.user.findMany({ where: { role: "TAX_OFFICER", isActive: true } });
    for (const officer of taxOfficers) {
      await createNotification({
        userId: officer.id,
        type: "SYSTEM",
        title: "Agreement rent updated",
        message: `Agreement ${agreement.agreementNumber} rent changed from ${agreement.rentalAmountEtb} to ${input.newRentalAmountEtb} ETB. Re-assessment may be needed.`,
        agreementId: input.agreementId,
        tx,
      });
    }

    return updated;
  });
}

export interface RenewAgreementInput {
  agreementId: string;
  newEndDate: Date;
  newRentalAmountEtb?: number;
  actorUserId: string;
  actorRole: UserRole;
}

export async function renewAgreement(input: RenewAgreementInput) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({ where: { id: input.agreementId } });

  if (agreement.status !== "ACTIVE") {
    throw new Error("Only active agreements can be renewed.");
  }
  if (input.actorRole !== "SUPER_ADMIN") {
    await assertOwnsProperty(input.actorUserId, agreement.propertyId);
  }
  if (input.newEndDate <= agreement.endDate) {
    throw new Error("The renewed end date must be after the current end date.");
  }

  return prisma.$transaction(async (tx) => {
    const lastVersion = await tx.agreementVersion.findFirst({
      where: { agreementId: input.agreementId },
      orderBy: { versionNumber: "desc" },
    });

    const rentalAmountEtb = input.newRentalAmountEtb ?? Number(agreement.rentalAmountEtb);

    if (input.newRentalAmountEtb != null) {
      const lastPriceChangeDate = await getLastPriceChangeDate(tx, input.agreementId, agreement.createdAt);
      const increaseCheck = checkRentIncreaseAllowed(
        Number(agreement.rentalAmountEtb),
        input.newRentalAmountEtb,
        lastPriceChangeDate
      );
      if (!increaseCheck.allowed) {
        throw new Error(rentIncreaseErrorMessage(increaseCheck));
      }
    }

    const updated = await tx.rentalAgreement.update({
      where: { id: input.agreementId },
      data: { endDate: input.newEndDate, rentalAmountEtb, status: "ACTIVE" },
    });

    await tx.agreementVersion.create({
      data: {
        agreementId: input.agreementId,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        changeType: "RENEWED",
        rentalAmountEtb,
        startDate: agreement.startDate,
        endDate: input.newEndDate,
        status: "ACTIVE",
        changedById: input.actorUserId,
        snapshot: serializeAgreement(agreement),
      },
    });

    await writeAuditLog({
      actorId: input.actorUserId,
      action: "AGREEMENT_RENEWED",
      entityType: "RentalAgreement",
      entityId: input.agreementId,
      previousValue: { endDate: agreement.endDate },
      newValue: { endDate: input.newEndDate, rentalAmountEtb },
      tx,
    });

    return updated;
  });
}

export async function requestTermination(agreementId: string, actorUserId: string, reason: string) {
  const { agreement } = await assertPartyToAgreement(actorUserId, agreementId);
  if (agreement.status !== "ACTIVE") {
    throw new Error("Only active agreements can have termination requested.");
  }

  const updated = await prisma.rentalAgreement.update({
    where: { id: agreementId },
    data: { terminationRequestedById: actorUserId, terminationReason: reason },
  });

  await writeAuditLog({
    actorId: actorUserId,
    action: "AGREEMENT_TERMINATION_REQUESTED",
    entityType: "RentalAgreement",
    entityId: agreementId,
    newValue: { reason },
  });

  // Notify housing officers so a request doesn't sit invisible until someone
  // happens to open the terminations queue.
  const housingOfficers = await prisma.user.findMany({ where: { role: "HOUSING_OFFICER", isActive: true } });
  for (const officer of housingOfficers) {
    await createNotification({
      userId: officer.id,
      type: "TERMINATION",
      title: "Termination requested",
      message: `Agreement ${agreement.agreementNumber} termination requested: ${reason}`,
      agreementId,
    });
  }

  return updated;
}

export async function approveTermination(agreementId: string, officerId: string) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({
    where: { id: agreementId },
    include: { tenant: true, property: true },
  });
  if (agreement.status !== "ACTIVE") {
    throw new Error("Only active agreements can be terminated.");
  }

  return prisma.$transaction(async (tx) => {
    const lastVersion = await tx.agreementVersion.findFirst({
      where: { agreementId },
      orderBy: { versionNumber: "desc" },
    });

    const updated = await tx.rentalAgreement.update({
      where: { id: agreementId },
      data: { status: "TERMINATED", terminatedAt: new Date() },
    });

    await tx.property.update({ where: { id: agreement.propertyId }, data: { status: "APPROVED" } });

    await tx.agreementVersion.create({
      data: {
        agreementId,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        changeType: "TERMINATED",
        rentalAmountEtb: agreement.rentalAmountEtb,
        startDate: agreement.startDate,
        endDate: agreement.endDate,
        status: "TERMINATED",
        changeReason: agreement.terminationReason,
        changedById: officerId,
        snapshot: serializeAgreement(agreement),
      },
    });

    await createNotification({
      userId: agreement.tenant.userId,
      type: "TERMINATION",
      title: "Rental agreement terminated",
      message: `Agreement ${agreement.agreementNumber} has been terminated.`,
      agreementId,
      tx,
    });

    await writeAuditLog({
      actorId: officerId,
      action: "AGREEMENT_TERMINATED",
      entityType: "RentalAgreement",
      entityId: agreementId,
      newValue: { status: "TERMINATED" },
      tx,
    });

    return updated;
  });
}

function serializeAgreement(agreement: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(agreement, (_key, value) =>
    typeof value === "object" && value !== null && "toFixed" in value ? value.toString() : value
  ));
}
