import { prisma } from "@/lib/db/prisma";

export class RecordAccessError extends Error {}

/** Throws unless `userId` is the primary-contact owner of `propertyId`. */
export async function assertOwnsProperty(userId: string, propertyId: string) {
  const ownership = await prisma.ownership.findFirst({
    where: { propertyId, isPrimaryContact: true, ownerProfile: { userId } },
  });
  if (!ownership) {
    throw new RecordAccessError("You do not have permission to act on this property.");
  }
}

/** Throws unless `userId` is the primary-contact owner of the property behind `agreementId`. */
export async function assertOwnsAgreementProperty(userId: string, agreementId: string) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({
    where: { id: agreementId },
    select: { propertyId: true },
  });
  await assertOwnsProperty(userId, agreement.propertyId);
}

/** Throws unless `userId` is either the tenant on the agreement or the primary owner of its property. */
export async function assertPartyToAgreement(userId: string, agreementId: string) {
  const agreement = await prisma.rentalAgreement.findUniqueOrThrow({
    where: { id: agreementId },
    include: {
      tenant: true,
      property: { include: { ownerships: { include: { ownerProfile: true } } } },
    },
  });
  const isTenant = agreement.tenant.userId === userId;
  const isOwner = agreement.property.ownerships.some(
    (o) => o.isPrimaryContact && o.ownerProfile.userId === userId
  );
  if (!isTenant && !isOwner) {
    throw new RecordAccessError("You are not a party to this agreement.");
  }
  return { isTenant, isOwner, agreement };
}
