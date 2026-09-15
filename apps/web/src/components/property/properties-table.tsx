import Link from "next/link";
import { Home } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface PropertyRow {
  id: string;
  code: string;
  title: string;
  subCityName: string;
  ownerName: string;
  askingRentEtb: number;
  status: string;
}

export function PropertiesTable({ properties, detailBasePath }: { properties: PropertyRow[]; detailBasePath: string }) {
  if (properties.length === 0) {
    return <EmptyState icon={Home} title="No properties" description="No properties match this view right now." />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Sub-city</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.ownerName}</TableCell>
                  <TableCell>{p.subCityName}</TableCell>
                  <TableCell>{p.askingRentEtb.toLocaleString()} ETB</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${detailBasePath}/${p.id}`}>View</Link>
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
