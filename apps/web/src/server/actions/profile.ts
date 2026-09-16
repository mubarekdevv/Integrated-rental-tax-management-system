"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { ownerProfileSchema, tenantProfileSchema, registerTenantByOwnerSchema } from "@/lib/validation/profile";
import { completeOwnerProfile, completeTenantProfile, registerTenantByOthers } from "@/lib/services/profile.service";
import type { ActionFormState } from "@/server/actions/auth";

export async function completeOwnerProfileAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requireUser();
  if (user.role !== "PROPERTY_OWNER") return { error: "Only property owners can update this profile." };

  const parsed = ownerProfileSchema.safeParse({
    idType: formData.get("idType"),
    idNumber: formData.get("idNumber"),
    gender: formData.get("gender") || undefined,
    subCity: formData.get("subCity") || undefined,
    woreda: formData.get("woreda") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await completeOwnerProfile({ userId: user.id, ...parsed.data });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save profile." };
  }

  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/owner/profile");
  return {};
}

export async function completeTenantProfileAction(
  _prevState: ActionFormState | undefined,
  formData: FormData
): Promise<ActionFormState> {
  const user = await requireUser();
  if (user.role !== "TENANT") return { error: "Only tenants can update this profile." };

  const parsed = tenantProfileSchema.safeParse({
    idType: formData.get("idType"),
    idNumber: formData.get("idNumber"),
    gender: formData.get("gender") || undefined,
    motherName: formData.get("motherName") || undefined,
    subCity: formData.get("subCity") || undefined,
    woreda: formData.get("woreda") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await completeTenantProfile({ userId: user.id, ...parsed.data });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save profile." };
  }

  revalidatePath("/dashboard/tenant");
  revalidatePath("/dashboard/tenant/profile");
  return {};
}

export interface RegisterTenantState extends ActionFormState {
  success?: { email: string; tempPassword: string };
}

export async function registerTenantByOwnerAction(
  _prevState: RegisterTenantState | undefined,
  formData: FormData
): Promise<RegisterTenantState> {
  const user = await requireUser();
  if (user.role !== "PROPERTY_OWNER" && user.role !== "HOUSING_OFFICER") {
    return { error: "You are not authorized to register a tenant." };
  }

  const parsed = registerTenantByOwnerSchema.safeParse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName") || undefined,
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    idType: formData.get("idType"),
    idNumber: formData.get("idNumber"),
    gender: formData.get("gender") || undefined,
    motherName: formData.get("motherName") || undefined,
    subCity: formData.get("subCity") || undefined,
    woreda: formData.get("woreda") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const result = await registerTenantByOthers({ actorUserId: user.id, ...parsed.data });
    return { success: { email: result.user.email, tempPassword: result.tempPassword } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not register tenant." };
  }
}
