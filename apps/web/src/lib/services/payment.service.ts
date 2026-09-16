import { prisma } from "@/lib/db/prisma";
import { getPaymentProvider } from "@/lib/services/payment-providers";
import { generatePaymentReference } from "@/lib/services/reference";
import { writeAuditLog } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";
import { RecordAccessError } from "@/lib/auth/record-access";
import type { PaymentProviderType, PaymentPurpose, UserRole } from "@/generated/prisma/enums";

/**
 * Record-level check: a payer may only pay their own service fee / tax
 * (the property owner) or their own penalty (the responsible party).
 * SUPER_ADMIN may record a payment on anyone's behalf.
 */
async function assertCanInitiatePayment(input: {
  payerId: string;
  payerRole: UserRole;
  purpose: PaymentPurpose;
  agreementId?: string;
  taxAssessmentId?: string;
  penaltyId?: string;
}) {
  if (input.payerRole === "SUPER_ADMIN") return;

  if (input.purpose === "SERVICE_FEE" && input.agreementId) {
    const agreement = await prisma.rentalAgreement.findUniqueOrThrow({
      where: { id: input.agreementId },
      include: { property: { include: { ownerships: { include: { ownerProfile: true } } } } },
    });
    const isOwner = agreement.property.ownerships.some(
      (o) => o.isPrimaryContact && o.ownerProfile.userId === input.payerId
    );
    if (!isOwner) throw new RecordAccessError("Only the property owner can pay this service fee.");
  }

  if (input.purpose === "TAX" && input.taxAssessmentId) {
    const assessment = await prisma.taxAssessment.findUniqueOrThrow({
      where: { id: input.taxAssessmentId },
      include: { agreement: { include: { property: { include: { ownerships: { include: { ownerProfile: true } } } } } } },
    });
    const isOwner = assessment.agreement.property.ownerships.some(
      (o) => o.isPrimaryContact && o.ownerProfile.userId === input.payerId
    );
    if (!isOwner) throw new RecordAccessError("Only the property owner can pay this tax assessment.");
  }

  if (input.purpose === "PENALTY" && input.penaltyId) {
    const penalty = await prisma.penalty.findUniqueOrThrow({ where: { id: input.penaltyId } });
    if (penalty.responsiblePartyId !== input.payerId) {
      throw new RecordAccessError("Only the responsible party can pay this penalty.");
    }
    if (penalty.status !== "APPROVED") {
      throw new Error("This penalty must be approved before it can be paid.");
    }
  }
}

export interface InitiatePaymentInput {
  purpose: PaymentPurpose;
  providerType: PaymentProviderType;
  amountEtb: number;
  payerId: string;
  payerRole: UserRole;
  payerPhone: string;
  agreementId?: string;
  taxAssessmentId?: string;
  penaltyId?: string;
}

/**
 * Initiates and (for the mock providers used in this prototype) immediately
 * settles a payment. Real providers would return PENDING and a webhook route
 * handler would call `completePayment` asynchronously — the boundary here is
 * intentionally the same either way.
 */
export async function initiatePayment(input: InitiatePaymentInput) {
  await assertCanInitiatePayment(input);

  const provider = getPaymentProvider(input.providerType);
  const referenceNumber = generatePaymentReference(input.purpose);

  const payment = await prisma.payment.create({
    data: {
      purpose: input.purpose,
      providerType: input.providerType,
      referenceNumber,
      amountEtb: input.amountEtb,
      status: "INITIATED",
      payerId: input.payerId,
      agreementId: input.agreementId,
      taxAssessmentId: input.taxAssessmentId,
      penaltyId: input.penaltyId,
    },
  });

  try {
    const result = await provider.initiate({
      referenceNumber,
      amountEtb: input.amountEtb,
      payerPhone: input.payerPhone,
    });

    if (result.status === "COMPLETED") {
      return completePayment(payment.id, input.payerId);
    }

    return payment;
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: error instanceof Error ? error.message : "Unknown error" },
    });
    throw error;
  }
}

export async function completePayment(paymentId: string, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    if (payment.taxAssessmentId) {
      await tx.taxAssessment.update({
        where: { id: payment.taxAssessmentId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    if (payment.penaltyId) {
      await tx.penalty.update({ where: { id: payment.penaltyId }, data: { status: "PAID" } });
    }

    await writeAuditLog({
      actorId: actorUserId,
      action: "PAYMENT_COMPLETED",
      entityType: "Payment",
      entityId: payment.id,
      newValue: { status: "COMPLETED", purpose: payment.purpose, amountEtb: payment.amountEtb.toString() },
      tx,
    });

    await createNotification({
      userId: payment.payerId,
      type: "SYSTEM",
      title: "Payment confirmed",
      message: `Your ${payment.purpose.toLowerCase()} payment of ${payment.amountEtb} ETB (ref ${payment.referenceNumber}) was confirmed.`,
      agreementId: payment.agreementId ?? undefined,
      tx,
    });

    return payment;
  });
}
