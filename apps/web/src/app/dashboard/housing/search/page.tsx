import { SearchX } from "lucide-react";
import { unifiedSearch } from "@/lib/services/search.service";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBox } from "@/components/shared/search-box";
import { EmptyState } from "@/components/shared/empty-state";
import { PropertiesTable } from "@/components/property/properties-table";
import { AgreementsTable } from "@/components/agreement/agreements-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HousingSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = q ? await unifiedSearch(q) : { properties: [], agreements: [], people: [] };
  const hasResults = results.properties.length + results.agreements.length + results.people.length > 0;

  return (
    <div>
      <PageHeader title="Search" description="Find a property, agreement, owner or tenant by name, phone, ID or number." />
      <SearchBox action="/dashboard/housing/search" defaultValue={q} />

      {!q ? (
        <EmptyState icon={SearchX} title="Enter a search term" description="Search across properties, agreements, owners and tenants." />
      ) : !hasResults ? (
        <EmptyState icon={SearchX} title="No results" description={`Nothing matched "${q}".`} />
      ) : (
        <div className="space-y-6">
          {results.people.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.people.map((p) => (
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
          {results.properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertiesTable
                  properties={results.properties.map((p) => ({
                    id: p.id,
                    code: p.code,
                    title: p.title,
                    subCityName: p.subCity.name,
                    ownerName: `${p.createdBy.firstName} ${p.createdBy.lastName}`,
                    askingRentEtb: Number(p.askingRentEtb),
                    status: p.status,
                  }))}
                  detailBasePath="/dashboard/housing/properties"
                />
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
                  detailBasePath="/dashboard/housing/agreements"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
