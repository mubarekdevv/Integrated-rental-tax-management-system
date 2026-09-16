import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CreatePenaltyDialog } from "@/components/penalty/create-penalty-dialog";
import { ReviewPenaltyButtons } from "@/components/penalty/review-penalty-buttons";

export default async function TaxPenaltiesPage() {
  const [penalties, activeAgreements, penaltyRules] = await Promise.all([
    prisma.penalty.findMany({
      orderBy: { createdAt: "desc" },
      include: { responsibleParty: true, penaltyRule: true },
    }),
    prisma.rentalAgreement.findMany({
      where: { status: "ACTIVE" },
      include: { property: { include: { ownerships: { include: { ownerProfile: true } } } } },
    }),
    prisma.penaltyRule.findMany({ where: { isActive: true, reasonCode: "LATE_TAX_PAYMENT" } }),
  ]);

  const agreementOptions = activeAgreements
    .map((a) => {
      const owner = a.property.ownerships.find((o) => o.isPrimaryContact)?.ownerProfile;
      if (!owner) return null;
      return {
        id: a.id,
        label: `${a.agreementNumber} - ${a.property.title}`,
        responsiblePartyId: owner.userId,
        rentalAmountEtb: Number(a.rentalAmountEtb),
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Penalties</h1>
        <CreatePenaltyDialog
          agreements={agreementOptions}
          penaltyRules={penaltyRules.map((r) => ({ id: r.id, name: r.name, calculationType: r.calculationType }))}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Penalties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Responsible Party</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.responsibleParty.firstName} {p.responsibleParty.lastName}
                    </TableCell>
                    <TableCell>{p.penaltyRule.name}</TableCell>
                    <TableCell>{Number(p.calculatedAmountEtb).toLocaleString()} ETB</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {["PENDING", "UNDER_REVIEW"].includes(p.status) && <ReviewPenaltyButtons penaltyId={p.id} />}
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
