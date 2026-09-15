"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, requireUser } from "@/lib/auth/session";
import { propertySchema } from "@/lib/validation/property";
import { createProperty, submitProperty, reviewProperty, type PropertyReviewDecision } from "@/lib/services/property.service";
import type { ActionFormState } from "@/server/actions/auth";

export async function createPropertyAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requirePermission("PROPERTY_CREATE");

  const parsed = propertySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    propertyType: formData.get("propertyType"),
    constructionType: formData.get("constructionType"),
    numberOfRooms: formData.get("numberOfRooms"),
    furnishedStatus: formData.get("furnishedStatus"),
    sizeSqm: formData.get("sizeSqm") || undefined,
    subCityId: formData.get("subCityId"),
    woredaId: formData.get("woredaId") || undefined,
    houseNumber: formData.get("houseNumber"),
    askingRentEtb: formData.get("askingRentEtb"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await createProperty({ ownerUserId: user.id, ...parsed.data });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not register property." };
  }

  revalidatePath("/dashboard/owner/properties");
  revalidatePath("/dashboard/owner");
  return {};
}

export async function submitPropertyAction(propertyId: string) {
  const user = await requireUser();
  await submitProperty(propertyId, user.id);
  revalidatePath("/dashboard/owner/properties");
  revalidatePath("/dashboard/housing/properties");
}

export async function reviewPropertyAction(
  propertyId: string,
  decision: PropertyReviewDecision,
  comment?: string
) {
  const user = await requirePermission("PROPERTY_REVIEW");
  await reviewProperty(propertyId, user.id, decision, comment);
  revalidatePath("/dashboard/housing/properties");
  revalidatePath("/dashboard/housing");
  revalidatePath("/properties");
}
