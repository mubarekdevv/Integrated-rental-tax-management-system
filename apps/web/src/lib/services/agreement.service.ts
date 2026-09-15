import { prisma } from "@/lib/db/prisma";
import { checkRentalPrice } from "@/lib/services/pricing";
import { generateAgreementNumber, generateWulNumber, generateQrToken } from "@/lib/services/reference";
import { writeAuditLog } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";
import { getSystemConfig } from "@/lib/services/config";
import type { PaymentFrequency } from "@/generated/prisma/enums";

const DEFAULT_SERVICE_FEE_PERCENTAGE = 2; // % of the first year's rent, configurable via SystemConfiguration.

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
      wulNumber = generateWulNumber(agreement.property.subCityId);
      wulQrToken = generateQrToken();
      wulIssuedAt = new Date();
    }

    // Approval and activation are the same moment in this workflow: once the
    // WUL is issued the tenancy is live, so the agreement goes straight to
    // ACTIVE rather than resting in an intermediate APPROVED state.
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
}

/** Records a price change as a new version, preserves history, re-checks the
 * configured price range, and re-flags for review when needed. */
export async function updateAgreementPrice(input: UpdateAgreementPriceInput) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({
    where: { id: input.agreementId },
    include: { property: true },
  });

  const priceCheck = await checkRentalPrice(agreement.property, input.newRentalAmountEtb);

  return prisma.$transaction(async (tx) => {
    const lastVersion = await tx.agreementVersion.findFirst({
      where: { agreementId: input.agreementId },
      orderBy: { versionNumber: "desc" },
    });

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

    return updated;
  });
}

export interface RenewAgreementInput {
  agreementId: string;
  newEndDate: Date;
  newRentalAmountEtb?: number;
  actorUserId: string;
}

export async function renewAgreement(input: RenewAgreementInput) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({ where: { id: input.agreementId } });

  return prisma.$transaction(async (tx) => {
    const lastVersion = await tx.agreementVersion.findFirst({
      where: { agreementId: input.agreementId },
      orderBy: { versionNumber: "desc" },
    });

    const rentalAmountEtb = input.newRentalAmountEtb ?? Number(agreement.rentalAmountEtb);

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
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({ where: { id: agreementId } });
  if (agreement.status !== "ACTIVE") {
    throw new Error("Only active agreements can have termination requested.");
  }
  return prisma.rentalAgreement.update({
    where: { id: agreementId },
    data: { terminationRequestedById: actorUserId, terminationReason: reason },
  });
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
