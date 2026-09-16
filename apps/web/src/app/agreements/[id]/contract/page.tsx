import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { generateQrDataUrl } from "@/lib/services/qrcode";
import { PrintButton } from "./print-button";

export default async function ContractDocumentPage({ params }: PageProps<"/agreements/[id]/contract">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const agreement = await prisma.rentalAgreement.findUnique({
    where: { id },
    include: {
      property: {
        include: { subCity: true, woreda: true, ownerships: { include: { ownerProfile: { include: { user: true } } } } },
      },
      tenant: { include: { user: true } },
    },
  });
  if (!agreement || !agreement.wulNumber) notFound();

  const owner = agreement.property.ownerships.find((o) => o.isPrimaryContact)?.ownerProfile;
  const isParty =
    owner?.userId === session.user.id ||
    agreement.tenant.userId === session.user.id ||
    ["HOUSING_OFFICER", "TAX_OFFICER", "SUPER_ADMIN"].includes(session.user.role);
  if (!isParty) redirect("/dashboard");

  const [qrDataUrl, t, tAgreement, tProperty, tCommon, tEnumFrequency, tEnumFurnished] = await Promise.all([
    generateQrDataUrl(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify/${agreement.wulQrToken}`),
    getTranslations("contract"),
    getTranslations("agreement"),
    getTranslations("property"),
    getTranslations("common"),
    getTranslations("enums.paymentFrequency"),
    getTranslations("enums.furnishedStatus"),
  ]);

  const woredaText = agreement.property.woreda ? t("woredaSuffix", { woreda: agreement.property.woreda.number }) : "";

  return (
    <div className="mx-auto max-w-2xl p-6 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="space-y-6 rounded-lg border bg-white p-8 text-sm text-black print:border-0">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-lg font-bold">{t("documentTitle")}</h1>
            <p className="text-muted-foreground">{t("bureau")}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Verification QR code" width={90} height={90} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={tAgreement("contractNumberLabel")} value={agreement.wulNumber} />
          <Field label={tAgreement("agreementNumber")} value={agreement.agreementNumber} />
          <Field label={t("issued")} value={agreement.wulIssuedAt?.toDateString() ?? "-"} />
          <Field label={tCommon("status")} value={agreement.status.replaceAll("_", " ")} />
        </div>

        <section>
          <h2 className="mb-2 font-semibold">{t("partiesTitle")}</h2>
          <p>
            {t("lessor")}: {owner?.user.firstName} {owner?.user.lastName} — {owner?.user.phone}
          </p>
          <p>
            {t("lessee")}: {agreement.tenant.user.firstName} {agreement.tenant.user.lastName} — {agreement.tenant.user.phone}
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">{t("propertyTitle")}</h2>
          <p>
            {t("propertyDescription", {
              title: agreement.property.title,
              houseNumber: agreement.property.houseNumber,
              subCity: agreement.property.subCity.name,
              woredaText,
            })}
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">{t("termsTitle")}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Field label={tAgreement("startDate")} value={agreement.startDate.toDateString()} />
            <Field label={tAgreement("endDate")} value={agreement.endDate.toDateString()} />
            <Field label={t("monthlyRent")} value={`${Number(agreement.rentalAmountEtb).toLocaleString()} ETB`} />
            <Field label={tAgreement("paymentFrequency")} value={tEnumFrequency(agreement.paymentFrequency)} />
            <Field label={tProperty("furnished")} value={tEnumFurnished(agreement.furnishedStatus)} />
            <Field label={tAgreement("serviceFee")} value={`${Number(agreement.serviceFeeAmountEtb).toLocaleString()} ETB`} />
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">{t("conditionsTitle")}</h2>
          <p className="text-muted-foreground">{t("conditionsText")}</p>
        </section>

        <div className="grid grid-cols-2 gap-8 pt-8 text-center">
          <div className="border-t pt-2">{t("lessorSignature")}</div>
          <div className="border-t pt-2">{t("lesseeSignature")}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
