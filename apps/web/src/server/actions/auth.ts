"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";
import { baseRegisterSchema, loginSchema } from "@/lib/validation/auth";
import { createUserAccount } from "@/lib/services/user.service";
import { DASHBOARD_PATH_BY_ROLE } from "@/lib/auth/permissions";

export interface ActionFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function loginAction(_prevState: ActionFormState | undefined, formData: FormData): Promise<ActionFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: (formData.get("callbackUrl") as string) || "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Something went wrong while signing in." };
    }
    throw error;
  }
}

export async function registerAction(_prevState: ActionFormState | undefined, formData: FormData): Promise<ActionFormState> {
  const parsed = baseRegisterSchema.safeParse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName") || undefined,
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createUserAccount(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Registration failed." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: DASHBOARD_PATH_BY_ROLE[parsed.data.role],
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please log in." };
    }
    throw error;
  }
}
