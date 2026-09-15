import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TaxRuleForm } from "./tax-rule-form";

export default async function AdminTaxRulesPage() {
  const rules = await prisma.taxRule.findMany({ orderBy: { effectiveFrom: "desc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tax Rules</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create Rate Change</CardTitle>
          <CardDescription>
            Creating a new rule deactivates the current one and starts the new rate immediately. Historical rates
            stay on record for previously assessed periods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaxRuleForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rate History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{Number(r.ratePercentage)}%</TableCell>
                  <TableCell>{r.effectiveFrom.toDateString()}</TableCell>
                  <TableCell>{r.effectiveTo ? r.effectiveTo.toDateString() : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "default" : "outline"}>{r.isActive ? "Active" : "Inactive"}</Badge>
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
