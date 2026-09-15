import { prisma } from "@/lib/db/prisma";
import { getPaymentProvider } from "@/lib/services/payment-providers";
import { generatePaymentReference } from "@/lib/services/reference";
import { writeAuditLog } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";
import type { PaymentProviderType, PaymentPurpose } from "@/generated/prisma/enums";

export interface InitiatePaymentInput {
  purpose: PaymentPurpose;
  providerType: PaymentProviderType;
  amountEtb: number;
  payerId: string;
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
