"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { initiatePaymentSchema } from "@/lib/validation/agreement";
import { initiatePayment } from "@/lib/services/payment.service";
import type { ActionFormState } from "@/server/actions/auth";
import type { PaymentPurpose } from "@/generated/prisma/enums";

interface PayInput {
  purpose: PaymentPurpose;
  amountEtb: number;
  agreementId?: string;
  taxAssessmentId?: string;
  penaltyId?: string;
}

export async function initiatePaymentAction(
  input: PayInput,
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requirePermission("PAYMENT_INITIATE");

  const parsed = initiatePaymentSchema.safeParse({
    providerType: formData.get("providerType"),
    payerPhone: formData.get("payerPhone"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await initiatePayment({
      purpose: input.purpose,
      providerType: parsed.data.providerType,
      amountEtb: input.amountEtb,
      payerId: user.id,
      payerPhone: parsed.data.payerPhone,
      agreementId: input.agreementId,
      taxAssessmentId: input.taxAssessmentId,
      penaltyId: input.penaltyId,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Payment failed." };
  }

  revalidatePath("/dashboard/owner/agreements");
  revalidatePath("/dashboard/owner/tax");
  revalidatePath("/dashboard/housing/agreements");
  revalidatePath("/dashboard/tenant/agreements");
  return {};
}
