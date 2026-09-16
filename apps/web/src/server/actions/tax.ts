"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { assessTax } from "@/lib/services/tax.service";

export async function assessTaxAction(agreementId: string, periodStart: Date, periodEnd: Date) {
  const user = await requirePermission("TAX_ASSESS");
  await assessTax({ agreementId, periodStart, periodEnd, actorId: user.id });
  revalidatePath("/dashboard/tax/assessments");
  revalidatePath("/dashboard/owner/tax");
}
