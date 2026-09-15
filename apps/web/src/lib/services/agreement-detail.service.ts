import { prisma } from "@/lib/db/prisma";

export async function getAgreementDetail(agreementId: string) {
  return prisma.rentalAgreement.findUnique({
    where: { id: agreementId },
    include: {
      property: { include: { subCity: true, woreda: true } },
      tenant: { include: { user: true } },
      payments: { orderBy: { createdAt: "desc" } },
      taxAssessments: { orderBy: { createdAt: "desc" }, include: { payment: true } },
      penalties: { orderBy: { createdAt: "desc" } },
      versions: { orderBy: { versionNumber: "desc" } },
      reviews: { orderBy: { createdAt: "desc" }, include: { reviewer: true } },
    },
  });
}

export type AgreementDetail = NonNullable<Awaited<ReturnType<typeof getAgreementDetail>>>;
