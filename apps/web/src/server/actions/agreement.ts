"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, requireUser } from "@/lib/auth/session";
import { agreementSchema } from "@/lib/validation/agreement";
import {
  createAgreement,
  submitAgreement,
  reviewAgreement,
  updateAgreementPrice,
  renewAgreement,
  requestTermination,
  approveTermination,
  type AgreementReviewDecision,
} from "@/lib/services/agreement.service";
import { findTenantByIdentifier } from "@/lib/services/profile.service";
import type { ActionFormState } from "@/server/actions/auth";

export async function createAgreementAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requirePermission("AGREEMENT_CREATE");

  const parsed = agreementSchema.safeParse({
    propertyId: formData.get("propertyId"),
    tenantIdentifier: formData.get("tenantIdentifier"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rentalAmountEtb: formData.get("rentalAmountEtb"),
    paymentFrequency: formData.get("paymentFrequency"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const tenant = await findTenantByIdentifier(parsed.data.tenantIdentifier);
  if (!tenant) {
    return { error: "No tenant found with that phone, email or ID number. Register the tenant first." };
  }

  try {
    const agreement = await createAgreement({
      propertyId: parsed.data.propertyId,
      tenantId: tenant.id,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      rentalAmountEtb: parsed.data.rentalAmountEtb,
      paymentFrequency: parsed.data.paymentFrequency,
      createdById: user.id,
    });
    await submitAgreement(agreement.id, user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create agreement." };
  }

  revalidatePath("/dashboard/owner/agreements");
  revalidatePath("/dashboard/housing/agreements");
  return {};
}

export async function reviewAgreementAction(agreementId: string, decision: AgreementReviewDecision, comment?: string) {
  const user = await requirePermission("AGREEMENT_REVIEW");
  await reviewAgreement(agreementId, user.id, decision, comment);
  revalidatePath("/dashboard/housing/agreements");
  revalidatePath("/dashboard/owner/agreements");
  revalidatePath("/dashboard/tenant/agreements");
}

export async function updateAgreementPriceAction(agreementId: string, newRentalAmountEtb: number, reason: string) {
  const user = await requireUser();
  await updateAgreementPrice({ agreementId, newRentalAmountEtb, reason, actorUserId: user.id });
  revalidatePath("/dashboard/owner/agreements");
}

export async function renewAgreementAction(agreementId: string, newEndDate: Date, newRentalAmountEtb?: number) {
  const user = await requireUser();
  await renewAgreement({ agreementId, newEndDate, newRentalAmountEtb, actorUserId: user.id });
  revalidatePath("/dashboard/owner/agreements");
  revalidatePath("/dashboard/tenant/agreements");
}

export async function requestTerminationAction(agreementId: string, reason: string) {
  const user = await requirePermission("AGREEMENT_TERMINATE_REQUEST");
  await requestTermination(agreementId, user.id, reason);
  revalidatePath("/dashboard/owner/agreements");
  revalidatePath("/dashboard/tenant/agreements");
  revalidatePath("/dashboard/housing/terminations");
}

export async function approveTerminationAction(agreementId: string) {
  const user = await requirePermission("AGREEMENT_REVIEW");
  await approveTermination(agreementId, user.id);
  revalidatePath("/dashboard/housing/terminations");
  revalidatePath("/dashboard/owner/agreements");
  revalidatePath("/dashboard/tenant/agreements");
}
