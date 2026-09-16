"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { createTaxRule, createPenaltyRule, createRentalPriceRule, toggleUserActive } from "@/lib/services/admin.service";
import { setSystemConfig } from "@/lib/services/config";
import type { ActionFormState } from "@/server/actions/auth";

export async function createTaxRuleAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requirePermission("TAX_RULE_MANAGE");
  const name = String(formData.get("name") ?? "");
  if (!name) return { error: "Provide a name for this tax rule." };

  const brackets: { minAmountEtb: number; maxAmountEtb: number | null; ratePercentage: number }[] = [];
  for (let i = 0; formData.has(`bracket_${i}_min`); i++) {
    const min = Number(formData.get(`bracket_${i}_min`));
    const maxRaw = String(formData.get(`bracket_${i}_max`) ?? "").trim();
    const rate = Number(formData.get(`bracket_${i}_rate`));
    if (Number.isNaN(min) || Number.isNaN(rate) || rate < 0) {
      return { error: `Bracket ${i + 1} has an invalid minimum or rate.` };
    }
    const max = maxRaw === "" ? null : Number(maxRaw);
    if (max !== null && (Number.isNaN(max) || max <= min)) {
      return { error: `Bracket ${i + 1}'s maximum must be greater than its minimum (or left blank for an open-ended top bracket).` };
    }
    brackets.push({ minAmountEtb: min, maxAmountEtb: max, ratePercentage: rate });
  }
  if (brackets.length === 0) {
    return { error: "At least one tax bracket is required." };
  }

  await createTaxRule({ name, brackets, effectiveFrom: new Date(), actorId: user.id });
  revalidatePath("/dashboard/admin/tax-rules");
  return {};
}

export async function createPenaltyRuleAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requirePermission("PENALTY_RULE_MANAGE");
  const name = String(formData.get("name") ?? "");
  const reasonCode = formData.get("reasonCode") as never;
  const calculationType = formData.get("calculationType") as never;
  if (!name) return { error: "Name is required." };

  await createPenaltyRule({
    name,
    reasonCode,
    calculationType,
    fixedAmountEtb: formData.get("fixedAmountEtb") ? Number(formData.get("fixedAmountEtb")) : undefined,
    percentage: formData.get("percentage") ? Number(formData.get("percentage")) : undefined,
    perDayAmountEtb: formData.get("perDayAmountEtb") ? Number(formData.get("perDayAmountEtb")) : undefined,
    actorId: user.id,
  });
  revalidatePath("/dashboard/admin/penalty-rules");
  return {};
}

export async function createPriceRuleAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requirePermission("PRICE_RULE_MANAGE");
  const label = String(formData.get("label") ?? "");
  const minPriceEtb = Number(formData.get("minPriceEtb"));
  const maxPriceEtb = Number(formData.get("maxPriceEtb"));
  if (!label || Number.isNaN(minPriceEtb) || Number.isNaN(maxPriceEtb) || minPriceEtb >= maxPriceEtb) {
    return { error: "Provide a label and a valid min/max price range." };
  }

  await createRentalPriceRule({
    label,
    subCityId: formData.get("subCityId") ? Number(formData.get("subCityId")) : undefined,
    propertyType: (formData.get("propertyType") as never) || undefined,
    constructionType: (formData.get("constructionType") as never) || undefined,
    furnishedStatus: (formData.get("furnishedStatus") as never) || undefined,
    minRooms: formData.get("minRooms") ? Number(formData.get("minRooms")) : undefined,
    maxRooms: formData.get("maxRooms") ? Number(formData.get("maxRooms")) : undefined,
    minPriceEtb,
    maxPriceEtb,
    actorId: user.id,
  });
  revalidatePath("/dashboard/admin/price-rules");
  return {};
}

export async function toggleUserActiveAction(userId: string) {
  const user = await requirePermission("USER_MANAGE");
  await toggleUserActive(userId, user.id);
  revalidatePath("/dashboard/admin/users");
}

export async function updateSystemConfigAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requirePermission("SYSTEM_CONFIG_MANAGE");
  const key = String(formData.get("key") ?? "");
  const rawValue = String(formData.get("value") ?? "");
  if (!key) return { error: "Missing configuration key." };

  const numeric = Number(rawValue);
  const value = Number.isNaN(numeric) ? rawValue : numeric;

  await setSystemConfig(key, value, user.id);
  revalidatePath("/dashboard/admin/settings");
  return {};
}
