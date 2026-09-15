import { notFound, redirect } from "next/navigation";
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

  const qrDataUrl = await generateQrDataUrl(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify/${agreement.wulQrToken}`
  );

  return (
    <div className="mx-auto max-w-2xl p-6 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="space-y-6 rounded-lg border bg-white p-8 text-sm text-black print:border-0">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-lg font-bold">Contract Agreement</h1>
            <p className="text-muted-foreground">Housing Development and Administration Bureau</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Verification QR code" width={90} height={90} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contract Number" value={agreement.wulNumber} />
          <Field label="Agreement Number" value={agreement.agreementNumber} />
          <Field label="Issued" value={agreement.wulIssuedAt?.toDateString() ?? "-"} />
          <Field label="Status" value={agreement.status.replaceAll("_", " ")} />
        </div>

        <section>
          <h2 className="mb-2 font-semibold">1. Parties</h2>
          <p>
            Lessor (Owner): {owner?.user.firstName} {owner?.user.lastName} — {owner?.user.phone}
          </p>
          <p>
            Lessee (Tenant): {agreement.tenant.user.firstName} {agreement.tenant.user.lastName} — {agreement.tenant.user.phone}
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">2. Leased Property</h2>
          <p>
            {agreement.property.title}, House No. {agreement.property.houseNumber}, {agreement.property.subCity.name} Sub-city
            {agreement.property.woreda ? `, Woreda ${agreement.property.woreda.number}` : ""}, Addis Ababa.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">3. Rental Terms</h2>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start Date" value={agreement.startDate.toDateString()} />
            <Field label="End Date" value={agreement.endDate.toDateString()} />
            <Field label="Monthly Rent" value={`${Number(agreement.rentalAmountEtb).toLocaleString()} ETB`} />
            <Field label="Payment Frequency" value={agreement.paymentFrequency.replaceAll("_", " ")} />
            <Field label="Furnished" value={agreement.furnishedStatus.replaceAll("_", " ")} />
            <Field label="Service Fee" value={`${Number(agreement.serviceFeeAmountEtb).toLocaleString()} ETB`} />
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">4. Conditions</h2>
          <p className="text-muted-foreground">
            This document certifies that the above rental agreement has been reviewed and approved by the Housing
            Development and Administration Bureau in accordance with the Housing Rent Control and Management
            Proclamation No. 1320/2016 and Directive No. 184/2025. Disputes regarding rent, damages, or termination
            are handled according to those regulations. Rent must be paid through a bank or other legal electronic
            means. Scan the QR code above to verify the current status of this agreement online.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-8 pt-8 text-center">
          <div className="border-t pt-2">Lessor Signature</div>
          <div className="border-t pt-2">Lessee Signature</div>
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
