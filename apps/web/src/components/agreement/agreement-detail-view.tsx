import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { PayDialog } from "@/components/shared/pay-dialog";
import { ReviewAgreementButtons } from "@/components/agreement/review-agreement-buttons";
import { RequestTerminationButton, ApproveTerminationButton } from "@/components/agreement/termination-controls";
import { UpdatePriceDialog } from "@/components/agreement/update-price-dialog";
import { RenewAgreementDialog } from "@/components/agreement/renew-agreement-dialog";
import { AssessTaxDialog } from "@/components/tax/assess-tax-dialog";
import { generateQrDataUrl } from "@/lib/services/qrcode";
import type { AgreementDetail } from "@/lib/services/agreement-detail.service";
import type { UserRole } from "@/generated/prisma/enums";

export async function AgreementDetailView({
  agreement,
  viewerRole,
  viewerUserId,
}: {
  agreement: AgreementDetail;
  viewerRole: UserRole;
  viewerUserId: string;
}) {
  const serviceFeePaid = agreement.payments.some((p) => p.purpose === "SERVICE_FEE" && p.status === "COMPLETED");
  const qrDataUrl = agreement.wulQrToken
    ? await generateQrDataUrl(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify/${agreement.wulQrToken}`)
    : null;

  const canReview = viewerRole === "HOUSING_OFFICER" && ["SUBMITTED", "UNDER_REVIEW"].includes(agreement.status);
  const canPayServiceFee =
    viewerRole === "PROPERTY_OWNER" && !serviceFeePaid && ["SUBMITTED", "UNDER_REVIEW", "CORRECTION_REQUIRED"].includes(agreement.status);
  const canRequestTermination =
    (viewerRole === "PROPERTY_OWNER" || viewerRole === "TENANT") && agreement.status === "ACTIVE" && !agreement.terminationRequestedById;
  const canApproveTermination = viewerRole === "HOUSING_OFFICER" && agreement.status === "ACTIVE" && !!agreement.terminationRequestedById;
  const canAssessTax = viewerRole === "TAX_OFFICER" && agreement.status === "ACTIVE";
  const canManageActiveAgreement =
    (viewerRole === "PROPERTY_OWNER" || viewerRole === "SUPER_ADMIN") && agreement.status === "ACTIVE";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{agreement.property.title}</h1>
          <p className="font-mono text-xs text-muted-foreground">{agreement.agreementNumber}</p>
        </div>
        <StatusBadge status={agreement.status} />
      </div>

      {agreement.priceFlagged && (
        <Alert variant="destructive">
          <AlertTitle>Price flagged for review</AlertTitle>
          <AlertDescription>{agreement.priceFlagReason}</AlertDescription>
        </Alert>
      )}

      {agreement.terminationRequestedById && agreement.status === "ACTIVE" && (
        <Alert>
          <AlertTitle>Termination requested</AlertTitle>
          <AlertDescription>{agreement.terminationReason}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agreement Terms</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Tenant" value={`${agreement.tenant.user.firstName} ${agreement.tenant.user.lastName}`} />
          <Field label="Property" value={`${agreement.property.title} (${agreement.property.code})`} />
          <Field label="Sub-city" value={agreement.property.subCity.name} />
          <Field label="Start Date" value={agreement.startDate.toDateString()} />
          <Field label="End Date" value={agreement.endDate.toDateString()} />
          <Field label="Rental Amount" value={`${Number(agreement.rentalAmountEtb).toLocaleString()} ETB`} />
          <Field label="Payment Frequency" value={agreement.paymentFrequency.replaceAll("_", " ")} />
          <Field label="Furnished" value={agreement.furnishedStatus.replaceAll("_", " ")} />
          <Field label="Service Fee" value={`${Number(agreement.serviceFeeAmountEtb).toLocaleString()} ETB (${serviceFeePaid ? "Paid" : "Unpaid"})`} />
        </CardContent>
      </Card>

      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Housing Review</CardTitle>
          </CardHeader>
          <CardContent>
            {!serviceFeePaid && (
              <p className="mb-3 text-sm text-muted-foreground">
                The service fee has not been paid yet; approval will be blocked until it is.
              </p>
            )}
            <ReviewAgreementButtons agreementId={agreement.id} />
          </CardContent>
        </Card>
      )}

      {canPayServiceFee && (
        <Card>
          <CardHeader>
            <CardTitle>Service Fee Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <PayDialog purpose="SERVICE_FEE" amountEtb={Number(agreement.serviceFeeAmountEtb)} agreementId={agreement.id} />
          </CardContent>
        </Card>
      )}

      {agreement.wulNumber && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Agreement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Contract verification QR code" width={140} height={140} className="rounded border" />
            )}
            <div className="space-y-1 text-sm">
              <p>
                Contract Number: <span className="font-mono font-medium">{agreement.wulNumber}</span>
              </p>
              <p className="text-muted-foreground">Issued {agreement.wulIssuedAt?.toDateString()}</p>
              <Link href={`/agreements/${agreement.id}/contract`} className="text-primary underline">
                View / print full document
              </Link>
              <br />
              <Link href={`/verify/${agreement.wulQrToken}`} className="text-primary underline">
                Open verification page
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tax Assessments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canAssessTax && agreement.taxAssessments.length === 0 && (
            <AssessTaxDialog
              agreementId={agreement.id}
              defaultStart={agreement.startDate.toISOString().slice(0, 10)}
              defaultEnd={agreement.endDate.toISOString().slice(0, 10)}
            />
          )}
          {agreement.taxAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tax assessments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreement.taxAssessments.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {t.periodStart.toDateString()} - {t.periodEnd.toDateString()}
                      </TableCell>
                      <TableCell>{Number(t.rateApplied)}%</TableCell>
                      <TableCell>{Number(t.taxAmountEtb).toLocaleString()} ETB</TableCell>
                      <TableCell>{t.dueDate.toDateString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {viewerRole === "PROPERTY_OWNER" && (t.status === "ASSESSED" || t.status === "OVERDUE") && (
                          <PayDialog purpose="TAX" amountEtb={Number(t.taxAmountEtb)} taxAssessmentId={t.id} label="Pay Tax" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {agreement.penalties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Penalties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreement.penalties.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.reason}</TableCell>
                      <TableCell>{Number(p.calculatedAmountEtb).toLocaleString()} ETB</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "APPROVED" && p.responsiblePartyId === viewerUserId && (
                          <PayDialog purpose="PENALTY" amountEtb={Number(p.calculatedAmountEtb)} penaltyId={p.id} label="Pay Penalty" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {agreement.versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Change History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreement.versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>v{v.versionNumber}</TableCell>
                      <TableCell>{v.changeType.replaceAll("_", " ")}</TableCell>
                      <TableCell>{Number(v.rentalAmountEtb).toLocaleString()} ETB</TableCell>
                      <TableCell>{v.endDate.toDateString()}</TableCell>
                      <TableCell>{v.changeReason ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {canManageActiveAgreement && (
          <>
            <UpdatePriceDialog agreementId={agreement.id} currentRentEtb={Number(agreement.rentalAmountEtb)} />
            <RenewAgreementDialog
              agreementId={agreement.id}
              currentEndDate={agreement.endDate.toDateString()}
              currentRentEtb={Number(agreement.rentalAmountEtb)}
            />
          </>
        )}
        {canRequestTermination && <RequestTerminationButton agreementId={agreement.id} />}
        {canApproveTermination && <ApproveTerminationButton agreementId={agreement.id} />}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
