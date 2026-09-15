import { Wallet } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface PaymentRow {
  id: string;
  purpose: string;
  providerType: string;
  referenceNumber: string;
  amountEtb: number;
  status: string;
  createdAt: Date;
  payerName?: string;
  contextLabel?: string;
}

const MOCK_PROVIDERS = new Set(["CBE", "TELEBIRR", "BANK_TRANSFER", "CASH"]);

export function PaymentsTable({ payments, showPayer = false }: { payments: PaymentRow[]; showPayer?: boolean }) {
  if (payments.length === 0) {
    return <EmptyState icon={Wallet} title="No payments yet" description="Payment records will appear here once a transaction is made." />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {showPayer && <TableHead>Payer</TableHead>}
                <TableHead>Purpose</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-xs">{p.createdAt.toLocaleDateString()}</TableCell>
                  {showPayer && <TableCell>{p.payerName ?? "-"}</TableCell>}
                  <TableCell>{p.purpose.replaceAll("_", " ")}</TableCell>
                  <TableCell className="max-w-40 truncate text-xs text-muted-foreground">{p.contextLabel ?? "-"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      {p.providerType.replaceAll("_", " ")}
                      {MOCK_PROVIDERS.has(p.providerType) && (
                        <Badge variant="outline" className="border-dashed text-[10px]">
                          simulated
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.referenceNumber}</TableCell>
                  <TableCell>{p.amountEtb.toLocaleString()} ETB</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
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
