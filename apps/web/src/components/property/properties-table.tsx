import Link from "next/link";
import { Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
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

export async function PropertiesTable({ properties, detailBasePath }: { properties: PropertyRow[]; detailBasePath: string }) {
  const [t, tCommon] = await Promise.all([getTranslations("property"), getTranslations("common")]);

  if (properties.length === 0) {
    return <EmptyState icon={Home} title={t("noPropertiesEmptyTitle")} description={t("noPropertiesMatchView")} />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("code")}</TableHead>
                <TableHead>{t("propertyTitle")}</TableHead>
                <TableHead>{t("owner")}</TableHead>
                <TableHead>{t("subCity")}</TableHead>
                <TableHead>{t("rent")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-right">{tCommon("actions")}</TableHead>
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
                      <Link href={`${detailBasePath}/${p.id}`}>{tCommon("view")}</Link>
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
