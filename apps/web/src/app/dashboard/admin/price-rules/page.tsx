import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriceRuleForm } from "./price-rule-form";

export default async function AdminPriceRulesPage() {
  const [rules, subCities] = await Promise.all([
    prisma.rentalPriceRule.findMany({ orderBy: { createdAt: "desc" }, include: { subCity: true } }),
    prisma.subCity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Rental Price Rules</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add a Price Range</CardTitle>
          <CardDescription>
            Sample configuration for demonstration only, not an authoritative legal price table. Used to flag
            contract prices that fall outside the expected range for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceRuleForm subCities={subCities} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Configured Ranges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Sub-city</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Range (ETB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.label}</TableCell>
                    <TableCell>{r.subCity?.name ?? "Citywide"}</TableCell>
                    <TableCell>{r.propertyType ?? "Any"}</TableCell>
                    <TableCell>
                      {Number(r.minPriceEtb).toLocaleString()} - {Number(r.maxPriceEtb).toLocaleString()}
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
