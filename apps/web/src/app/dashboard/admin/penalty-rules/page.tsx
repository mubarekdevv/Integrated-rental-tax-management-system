import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PenaltyRuleForm } from "./penalty-rule-form";

export default async function AdminPenaltyRulesPage() {
  const rules = await prisma.penaltyRule.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Penalty Rules</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add a Penalty Rule</CardTitle>
          <CardDescription>
            Configurable compliance framework — not an exhaustive legal codification of every penalty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PenaltyRuleForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Configured Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.reasonCode.replaceAll("_", " ")}</TableCell>
                  <TableCell>{r.calculationType.replaceAll("_", " ")}</TableCell>
                  <TableCell>
                    {r.fixedAmountEtb
                      ? `${Number(r.fixedAmountEtb).toLocaleString()} ETB`
                      : r.percentage
                        ? `${Number(r.percentage)}%`
                        : `${Number(r.perDayAmountEtb ?? 0).toLocaleString()} ETB/day`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
