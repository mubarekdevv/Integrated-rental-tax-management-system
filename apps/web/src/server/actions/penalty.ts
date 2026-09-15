"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { createPenalty, reviewPenalty, type PenaltyDecision } from "@/lib/services/penalty.service";

interface CreatePenaltyFormInput {
  penaltyRuleId: string;
  responsiblePartyId: string;
  reason: string;
  delayDays?: number;
  baseAmountEtb?: number;
  agreementId?: string;
  propertyId?: string;
  evidenceNote?: string;
}

export async function createPenaltyAction(input: CreatePenaltyFormInput) {
  const user = await requirePermission("PENALTY_REVIEW");
  await createPenalty({ ...input, createdById: user.id });
  revalidatePath("/dashboard/housing/penalties");
  revalidatePath("/dashboard/tax/penalties");
}

export async function reviewPenaltyAction(penaltyId: string, decision: PenaltyDecision, note?: string) {
  const user = await requirePermission("PENALTY_REVIEW");
  await reviewPenalty(penaltyId, user.id, decision, note);
  revalidatePath("/dashboard/housing/penalties");
  revalidatePath("/dashboard/tax/penalties");
}
