import { prisma } from "@/lib/db/prisma";
import { createUserAccount, generateTempPassword } from "@/lib/services/user.service";
import { writeAuditLog } from "@/lib/services/audit";
import type { Gender, IdType } from "@/generated/prisma/enums";

export interface CompleteOwnerProfileInput {
  userId: string;
  idType: IdType;
  idNumber: string;
  gender?: Gender;
  subCity?: string;
  woreda?: string;
}

export async function completeOwnerProfile(input: CompleteOwnerProfileInput) {
  return prisma.ownerProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      idType: input.idType,
      idNumber: input.idNumber,
      gender: input.gender,
      subCity: input.subCity,
      woreda: input.woreda,
    },
    update: {
      idType: input.idType,
      idNumber: input.idNumber,
      gender: input.gender,
      subCity: input.subCity,
      woreda: input.woreda,
    },
  });
}

export interface CompleteTenantProfileInput {
  userId: string;
  idType: IdType;
  idNumber: string;
  gender?: Gender;
  motherName?: string;
  subCity?: string;
  woreda?: string;
}

export async function completeTenantProfile(input: CompleteTenantProfileInput) {
  return prisma.tenantProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      idType: input.idType,
      idNumber: input.idNumber,
      gender: input.gender,
      motherName: input.motherName,
      subCity: input.subCity,
      woreda: input.woreda,
    },
    update: {
      idType: input.idType,
      idNumber: input.idNumber,
      gender: input.gender,
      motherName: input.motherName,
      subCity: input.subCity,
      woreda: input.woreda,
    },
  });
}

export interface RegisterTenantByOthersInput {
  actorUserId: string;
  email: string;
  phone: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  idType: IdType;
  idNumber: string;
  gender?: Gender;
  motherName?: string;
  subCity?: string;
  woreda?: string;
}

/**
 * Property owners (or housing staff) can register a tenant directly rather
 * than waiting for the tenant to self-register. A temporary password is
 * generated; the tenant should reset it on first login.
 */
export async function registerTenantByOthers(input: RegisterTenantByOthersInput) {
  const tempPassword = generateTempPassword();
  const user = await createUserAccount({
    email: input.email,
    phone: input.phone,
    password: tempPassword,
    role: "TENANT",
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    createdById: input.actorUserId,
  });

  const tenantProfile = await completeTenantProfile({
    userId: user.id,
    idType: input.idType,
    idNumber: input.idNumber,
    gender: input.gender,
    motherName: input.motherName,
    subCity: input.subCity,
    woreda: input.woreda,
  });

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "TENANT_REGISTERED_BY_OTHER",
    entityType: "TenantProfile",
    entityId: tenantProfile.id,
    newValue: { email: user.email },
  });

  return { user, tenantProfile, tempPassword };
}

export async function findTenantByIdentifier(identifier: string) {
  return prisma.tenantProfile.findFirst({
    where: {
      OR: [{ idNumber: identifier }, { user: { phone: identifier } }, { user: { email: identifier.toLowerCase() } }],
    },
    include: { user: true },
  });
}
