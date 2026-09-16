import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { markOverdueAssessments } from "@/lib/services/tax.service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TaxOverduePage() {
  await markOverdueAssessments();

  const assessments = await prisma.taxAssessment.findMany({
    where: { status: "OVERDUE" },
    orderBy: { dueDate: "asc" },
    include: { agreement: { include: { property: true } } },
  });

  return (
    <div>
      <PageHeader title="Overdue Tax" description="Assessments past their due date and still unpaid." />
      {assessments.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Nothing overdue" description="All assessed tax has been paid on time." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Agreement</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.agreement.property.title}</TableCell>
                      <TableCell className="font-mono text-xs">{a.agreement.agreementNumber}</TableCell>
                      <TableCell>{Number(a.taxAmountEtb).toLocaleString()} ETB</TableCell>
                      <TableCell className="text-destructive">{a.dueDate.toDateString()}</TableCell>
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
      )}
    </div>
  );
}
