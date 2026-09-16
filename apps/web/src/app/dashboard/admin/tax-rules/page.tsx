import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TaxRuleForm } from "./tax-rule-form";

export default async function AdminTaxRulesPage() {
  const rules = await prisma.taxRule.findMany({
    orderBy: { effectiveFrom: "desc" },
    include: { brackets: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Tax Rules</h1>
        <p className="text-sm text-muted-foreground">
          Rental-income tax brackets only. This is separate from any rental-price-increase regulation — a
          landlord&apos;s permitted rent increase after the legal waiting period is not a tax rule and is not
          configured here.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create Rate Change</CardTitle>
          <CardDescription>
            Creating a new rule deactivates the current one and starts the new bracket table immediately.
            Historical brackets stay on record for previously assessed periods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaxRuleForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rule History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((r) => (
            <div key={r.id} className="rounded-md border p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.effectiveFrom.toDateString()} — {r.effectiveTo ? r.effectiveTo.toDateString() : "present"}
                  </p>
                </div>
                <Badge variant={r.isActive ? "default" : "outline"}>{r.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bracket (ETB / year)</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.brackets.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        {Number(b.minAmountEtb).toLocaleString()} – {b.maxAmountEtb ? Number(b.maxAmountEtb).toLocaleString() : "and above"}
                      </TableCell>
                      <TableCell>{Number(b.ratePercentage)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
