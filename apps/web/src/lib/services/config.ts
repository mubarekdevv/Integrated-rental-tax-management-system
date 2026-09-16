import { prisma } from "@/lib/db/prisma";

/**
 * Rental income tax is progressive (see docs/ASSUMPTIONS.md) and is never
 * hard-coded in business logic. The bracket set is read from the currently
 * active TaxRule row, which an authorized SUPER_ADMIN can update through the
 * admin console.
 */
export async function getActiveTaxRule(referenceDate: Date = new Date()) {
  const rule = await prisma.taxRule.findFirst({
    where: {
      isActive: true,
      effectiveFrom: { lte: referenceDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: referenceDate } }],
    },
    orderBy: { effectiveFrom: "desc" },
    include: { brackets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!rule) {
    throw new Error("No active tax rule is configured. An admin must configure one.");
  }
  return rule;
}

export async function getSystemConfig<T = unknown>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemConfiguration.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as T;
}

export async function setSystemConfig(key: string, value: unknown, updatedById: string, description?: string) {
  return prisma.systemConfiguration.upsert({
    where: { key },
    create: { key, value: value as never, description, updatedById },
    update: { value: value as never, updatedById, ...(description ? { description } : {}) },
  });
}
