import { prisma } from "@/lib/db/prisma";

export async function getOwnerDashboard(userId: string) {
  const ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId } });
  if (!ownerProfile) {
    return { profileComplete: false as const };
  }

  const [properties, agreements, notifications] = await Promise.all([
    prisma.property.findMany({
      where: { ownerships: { some: { ownerProfileId: ownerProfile.id } } },
      orderBy: { createdAt: "desc" },
      include: { subCity: true },
    }),
    prisma.rentalAgreement.findMany({
      where: { property: { ownerships: { some: { ownerProfileId: ownerProfile.id } } } },
      orderBy: { createdAt: "desc" },
      include: { property: true, tenant: { include: { user: true } }, taxAssessments: true },
    }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return {
    profileComplete: true as const,
    ownerProfile,
    properties,
    agreements,
    notifications,
    stats: {
      totalProperties: properties.length,
      activeAgreements: agreements.filter((a) => a.status === "ACTIVE").length,
      pendingReview: properties.filter((p) => ["SUBMITTED", "UNDER_REVIEW"].includes(p.status)).length,
      unpaidTax: agreements.reduce(
        (sum, a) => sum + a.taxAssessments.filter((t) => t.status === "ASSESSED" || t.status === "OVERDUE").length,
        0
      ),
    },
  };
}

export async function getTenantDashboard(userId: string) {
  const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId } });
  if (!tenantProfile) {
    return { profileComplete: false as const };
  }

  const [agreements, notifications] = await Promise.all([
    prisma.rentalAgreement.findMany({
      where: { tenantId: tenantProfile.id },
      orderBy: { createdAt: "desc" },
      include: { property: { include: { subCity: true } }, payments: true },
    }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return {
    profileComplete: true as const,
    tenantProfile,
    agreements,
    notifications,
    activeAgreement: agreements.find((a) => a.status === "ACTIVE") ?? null,
  };
}

export async function getHousingOfficerDashboard() {
  const [pendingProperties, pendingAgreements, terminationRequests, recentReviews] = await Promise.all([
    prisma.property.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      include: { subCity: true, createdBy: true },
    }),
    prisma.rentalAgreement.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      include: { property: true, tenant: { include: { user: true } } },
    }),
    prisma.rentalAgreement.findMany({
      where: { status: "ACTIVE", terminationRequestedById: { not: null } },
      include: { property: true, tenant: { include: { user: true } } },
    }),
    prisma.propertyReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { property: true, reviewer: true },
    }),
  ]);

  return { pendingProperties, pendingAgreements, terminationRequests, recentReviews };
}

export async function getTaxOfficerDashboard() {
  const [activeAgreementsWithoutAssessment, assessments, penalties] = await Promise.all([
    prisma.rentalAgreement.findMany({
      where: { status: "ACTIVE", taxAssessments: { none: {} } },
      include: { property: true, tenant: { include: { user: true } } },
    }),
    prisma.taxAssessment.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { agreement: { include: { property: true } } },
    }),
    prisma.penalty.findMany({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      include: { responsibleParty: true, agreement: true },
    }),
  ]);

  const totals = assessments.reduce(
    (acc, a) => {
      acc.assessed += Number(a.taxAmountEtb);
      if (a.status === "PAID") acc.collected += Number(a.taxAmountEtb);
      return acc;
    },
    { assessed: 0, collected: 0 }
  );

  return { activeAgreementsWithoutAssessment, assessments, penalties, totals };
}

export async function getAdminDashboard() {
  const [userCounts, propertyCount, agreementCount, auditLogs, taxRule, config] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.property.count(),
    prisma.rentalAgreement.count(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { actor: true } }),
    prisma.taxRule.findFirst({ where: { isActive: true } }),
    prisma.systemConfiguration.findMany(),
  ]);

  return { userCounts, propertyCount, agreementCount, auditLogs, taxRule, config };
}
