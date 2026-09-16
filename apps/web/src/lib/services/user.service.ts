import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";
import type { UserRole } from "@/generated/prisma/enums";

export interface CreateUserInput {
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  locale?: string;
  createdById?: string | null;
}

export async function createUserAccount(input: CreateUserInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone: input.phone }] },
  });
  if (existing) {
    throw new Error("An account with this email or phone number already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      phone: input.phone,
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      locale: input.locale ?? "en",
    },
  });

  await writeAuditLog({
    actorId: input.createdById ?? user.id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
    newValue: { email: user.email, role: user.role },
  });

  return user;
}

export function generateTempPassword() {
  return `Temp-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 100)}`;
}
