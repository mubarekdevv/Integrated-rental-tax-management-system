import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

interface WriteAuditLogInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  tx?: Prisma.TransactionClient;
}

/** High-priority security requirement: every write to a sensitive record is logged. */
export async function writeAuditLog(input: WriteAuditLogInput) {
  const client = input.tx ?? prisma;
  await client.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      previousValueJson: toJson(input.previousValue),
      newValueJson: toJson(input.newValue),
    },
  });
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}
