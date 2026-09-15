import { SearchX } from "lucide-react";
import { unifiedSearch } from "@/lib/services/search.service";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBox } from "@/components/shared/search-box";
import { EmptyState } from "@/components/shared/empty-state";
import { AgreementsTable } from "@/components/agreement/agreements-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TaxSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = q ? await unifiedSearch(q) : { properties: [], agreements: [], people: [] };
  const hasResults = results.agreements.length + results.people.length > 0;

  return (
    <div>
      <PageHeader title="Taxpayer Search" description="Find a property owner or agreement by name, phone or ID number." />
      <SearchBox action="/dashboard/tax/search" defaultValue={q} placeholder="Search by owner name, phone, ID or agreement number..." />

      {!q ? (
        <EmptyState icon={SearchX} title="Enter a search term" description="Search for a taxpayer or their agreements." />
      ) : !hasResults ? (
        <EmptyState icon={SearchX} title="No results" description={`Nothing matched "${q}".`} />
      ) : (
        <div className="space-y-6">
          {results.people.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Taxpayers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.people
                  .filter((p) => p.role === "Owner")
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.phone} &middot; ID {p.idNumber}
                        </p>
                      </div>
                      <Badge variant="outline">{p.role}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
          {results.agreements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Agreements</CardTitle>
              </CardHeader>
              <CardContent>
                <AgreementsTable
                  agreements={results.agreements.map((a) => ({
                    id: a.id,
                    agreementNumber: a.agreementNumber,
                    propertyTitle: a.property.title,
                    tenantName: `${a.tenant.user.firstName} ${a.tenant.user.lastName}`,
                    rentalAmountEtb: Number(a.rentalAmountEtb),
                    status: a.status,
                  }))}
                  detailBasePath="/dashboard/tax/agreements"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
