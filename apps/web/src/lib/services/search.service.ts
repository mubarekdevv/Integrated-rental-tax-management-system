import { prisma } from "@/lib/db/prisma";

export async function unifiedSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return { properties: [], agreements: [], people: [] };
  }
  const q = query.trim();

  const [properties, agreements, owners, tenants] = await Promise.all([
    prisma.property.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { houseNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { subCity: true, createdBy: true },
      take: 20,
    }),
    prisma.rentalAgreement.findMany({
      where: { agreementNumber: { contains: q, mode: "insensitive" } },
      include: { property: true, tenant: { include: { user: true } } },
      take: 20,
    }),
    prisma.ownerProfile.findMany({
      where: {
        OR: [
          { idNumber: { contains: q, mode: "insensitive" } },
          { user: { firstName: { contains: q, mode: "insensitive" } } },
          { user: { lastName: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { user: true },
      take: 20,
    }),
    prisma.tenantProfile.findMany({
      where: {
        OR: [
          { idNumber: { contains: q, mode: "insensitive" } },
          { user: { firstName: { contains: q, mode: "insensitive" } } },
          { user: { lastName: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { user: true },
      take: 20,
    }),
  ]);

  const people = [
    ...owners.map((o) => ({
      id: o.id,
      userId: o.userId,
      name: `${o.user.firstName} ${o.user.lastName}`,
      phone: o.user.phone,
      idNumber: o.idNumber,
      role: "Owner" as const,
    })),
    ...tenants.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: `${t.user.firstName} ${t.user.lastName}`,
      phone: t.user.phone,
      idNumber: t.idNumber,
      role: "Tenant" as const,
    })),
  ];

  return { properties, agreements, people };
}
