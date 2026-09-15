import { prisma } from "@/lib/db/prisma";
import { generatePropertyCode } from "@/lib/services/reference";
import { writeAuditLog } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";
import type {
  ConstructionType,
  FurnishedStatus,
  PropertyType,
} from "@/generated/prisma/enums";

export interface CreatePropertyInput {
  ownerUserId: string;
  title: string;
  description?: string;
  propertyType: PropertyType;
  constructionType: ConstructionType;
  numberOfRooms: number;
  furnishedStatus: FurnishedStatus;
  sizeSqm?: number;
  subCityId: number;
  woredaId?: number;
  houseNumber: string;
  askingRentEtb: number;
}

export async function createProperty(input: CreatePropertyInput) {
  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: input.ownerUserId },
  });
  if (!ownerProfile) {
    throw new Error("Complete your owner profile before registering a property.");
  }

  const code = generatePropertyCode(input.subCityId, input.houseNumber);

  const property = await prisma.$transaction(async (tx) => {
    const created = await tx.property.create({
      data: {
        code,
        title: input.title,
        description: input.description,
        propertyType: input.propertyType,
        constructionType: input.constructionType,
        numberOfRooms: input.numberOfRooms,
        furnishedStatus: input.furnishedStatus,
        sizeSqm: input.sizeSqm,
        subCityId: input.subCityId,
        woredaId: input.woredaId,
        houseNumber: input.houseNumber,
        askingRentEtb: input.askingRentEtb,
        status: "DRAFT",
        createdById: input.ownerUserId,
        ownerships: {
          create: {
            ownerProfileId: ownerProfile.id,
            ownershipType: "ORIGINAL_OWNER",
            sharePercentage: 100,
            isPrimaryContact: true,
          },
        },
      },
    });

    await writeAuditLog({
      actorId: input.ownerUserId,
      action: "PROPERTY_CREATED",
      entityType: "Property",
      entityId: created.id,
      newValue: created,
      tx,
    });

    return created;
  });

  return property;
}

export async function submitProperty(propertyId: string, actorUserId: string) {
  const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
  if (property.createdById !== actorUserId) {
    throw new Error("Only the property owner who registered this property can submit it.");
  }
  if (property.status !== "DRAFT" && property.status !== "CORRECTION_REQUIRED") {
    throw new Error(`Property cannot be submitted from status ${property.status}.`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.property.update({
      where: { id: propertyId },
      data: { status: "SUBMITTED", reviewComment: null },
    });

    await tx.propertyReview.create({
      data: {
        propertyId,
        reviewerId: actorUserId,
        action: "SUBMITTED",
        previousStatus: property.status,
        newStatus: "SUBMITTED",
      },
    });

    await writeAuditLog({
      actorId: actorUserId,
      action: "PROPERTY_SUBMITTED",
      entityType: "Property",
      entityId: propertyId,
      previousValue: { status: property.status },
      newValue: { status: "SUBMITTED" },
      tx,
    });

    return updated;
  });
}

export type PropertyReviewDecision = "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED";

export async function reviewProperty(
  propertyId: string,
  officerId: string,
  decision: PropertyReviewDecision,
  comment?: string
) {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    include: { ownerships: { include: { ownerProfile: { include: { user: true } } } } },
  });

  if (!["SUBMITTED", "UNDER_REVIEW"].includes(property.status)) {
    throw new Error(`Property in status ${property.status} cannot be reviewed.`);
  }

  const reviewAction =
    decision === "APPROVED" ? "APPROVED" : decision === "REJECTED" ? "REJECTED" : "CORRECTION_REQUESTED";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.property.update({
      where: { id: propertyId },
      data: {
        status: decision,
        reviewComment: comment,
        approvedById: decision === "APPROVED" ? officerId : property.approvedById,
        approvedAt: decision === "APPROVED" ? new Date() : property.approvedAt,
        isListed: decision === "APPROVED" ? true : property.isListed,
      },
    });

    await tx.propertyReview.create({
      data: {
        propertyId,
        reviewerId: officerId,
        action: reviewAction,
        comment,
        previousStatus: property.status,
        newStatus: decision,
      },
    });

    const primaryOwnerUserId = property.ownerships.find((o) => o.isPrimaryContact)?.ownerProfile.userId;
    if (primaryOwnerUserId) {
      await createNotification({
        userId: primaryOwnerUserId,
        type: decision === "APPROVED" ? "APPROVAL" : decision === "REJECTED" ? "REJECTION" : "CORRECTION_REQUIRED",
        title: `Property registration ${decision.toLowerCase().replace("_", " ")}`,
        message:
          comment ??
          `Your property "${property.title}" (${property.code}) is now ${decision.replace("_", " ").toLowerCase()}.`,
        tx,
      });
    }

    await writeAuditLog({
      actorId: officerId,
      action: `PROPERTY_${reviewAction}`,
      entityType: "Property",
      entityId: propertyId,
      previousValue: { status: property.status },
      newValue: { status: decision, comment },
      tx,
    });

    return updated;
  });
}
