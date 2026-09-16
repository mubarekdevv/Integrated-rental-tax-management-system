import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

export default async function TaxAssessmentsPage() {
  const assessments = await prisma.taxAssessment.findMany({
    orderBy: { createdAt: "desc" },
    include: { agreement: { include: { property: true } } },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tax Assessments</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Effective Rate</TableHead>
                  <TableHead>Tax Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.agreement.property.title}</TableCell>
                    <TableCell>
                      {a.periodStart.toDateString()} - {a.periodEnd.toDateString()}
                    </TableCell>
                    <TableCell>{Number(a.rateApplied)}%</TableCell>
                    <TableCell>{Number(a.taxAmountEtb).toLocaleString()} ETB</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/tax/agreements/${a.agreementId}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
