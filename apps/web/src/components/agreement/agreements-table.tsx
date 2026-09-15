import Link from "next/link";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface AgreementRow {
  id: string;
  agreementNumber: string;
  propertyTitle: string;
  tenantName: string;
  ownerName?: string;
  rentalAmountEtb: number;
  status: string;
  priceFlagged?: boolean;
}

export function AgreementsTable({ agreements, detailBasePath }: { agreements: AgreementRow[]; detailBasePath: string }) {
  if (agreements.length === 0) {
    return <EmptyState icon={FileText} title="No agreements" description="No agreements match this view right now." />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement #</TableHead>
                <TableHead>Property</TableHead>
                {agreements[0]?.ownerName !== undefined && <TableHead>Owner</TableHead>}
                <TableHead>Tenant</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.agreementNumber}</TableCell>
                  <TableCell className="font-medium">
                    {a.propertyTitle}
                    {a.priceFlagged && (
                      <span className="ml-1.5 inline-block rounded bg-amber-100 px-1 text-[10px] font-normal text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        price flagged
                      </span>
                    )}
                  </TableCell>
                  {a.ownerName !== undefined && <TableCell>{a.ownerName}</TableCell>}
                  <TableCell>{a.tenantName}</TableCell>
                  <TableCell>{a.rentalAmountEtb.toLocaleString()} ETB</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${detailBasePath}/${a.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
