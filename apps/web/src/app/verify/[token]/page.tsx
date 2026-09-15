import { CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { PublicHeader } from "@/components/shared/public-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function VerifyWulPage({ params }: PageProps<"/verify/[token]">) {
  const { token } = await params;
  const agreement = await prisma.rentalAgreement.findUnique({
    where: { wulQrToken: token },
    include: { property: { include: { subCity: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            {agreement ? (
              <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
            ) : (
              <XCircle className="mx-auto size-12 text-destructive" />
            )}
            <CardTitle className="mt-2">{agreement ? "Valid WUL Document" : "Document Not Found"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-center text-sm">
            {agreement ? (
              <>
                <p className="text-muted-foreground">This QR code corresponds to a genuine, system-issued rental agreement.</p>
                <div className="rounded-md border p-4 text-left">
                  <Row label="WUL Number" value={agreement.wulNumber ?? "-"} />
                  <Row label="Agreement Number" value={agreement.agreementNumber} />
                  <Row label="Sub-city" value={agreement.property.subCity.name} />
                  <Row label="Issued" value={agreement.wulIssuedAt?.toDateString() ?? "-"} />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={agreement.status} />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                No agreement matches this verification code. It may be invalid or the link may be corrupted.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
