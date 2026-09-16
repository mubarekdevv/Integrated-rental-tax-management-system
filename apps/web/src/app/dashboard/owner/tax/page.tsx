import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PayDialog } from "@/components/shared/pay-dialog";

export default async function OwnerTaxPage() {
  const session = await auth();
  const ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: session!.user.id } });

  const assessments = ownerProfile
    ? await prisma.taxAssessment.findMany({
        where: { agreement: { property: { ownerships: { some: { ownerProfileId: ownerProfile.id } } } } },
        orderBy: { createdAt: "desc" },
        include: { agreement: { include: { property: true } } },
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tax</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tax Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tax assessments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.agreement.property.title}</TableCell>
                      <TableCell>
                        {a.periodStart.toDateString()} - {a.periodEnd.toDateString()}
                      </TableCell>
                      <TableCell>{Number(a.taxAmountEtb).toLocaleString()} ETB</TableCell>
                      <TableCell>{a.dueDate.toDateString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {(a.status === "ASSESSED" || a.status === "OVERDUE") && (
                          <PayDialog purpose="TAX" amountEtb={Number(a.taxAmountEtb)} taxAssessmentId={a.id} label="Pay Tax" />
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
    </div>
  );
}
