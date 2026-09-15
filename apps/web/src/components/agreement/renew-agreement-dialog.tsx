"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { renewAgreementAction } from "@/server/actions/agreement";

export function RenewAgreementDialog({
  agreementId,
  currentEndDate,
  currentRentEtb,
}: {
  agreementId: string;
  currentEndDate: string;
  currentRentEtb: number;
}) {
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [rent, setRent] = useState(String(currentRentEtb));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarPlus className="size-4" /> Renew Agreement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew Agreement</DialogTitle>
          <DialogDescription>Current end date: {currentEndDate}. Extend the term and optionally update the rent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="renew-end-date">New End Date</Label>
            <Input id="renew-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renew-rent">Monthly Rent (ETB)</Label>
            <Input id="renew-rent" type="number" min={0} value={rent} onChange={(e) => setRent(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !endDate}
            onClick={() =>
              startTransition(async () => {
                try {
                  await renewAgreementAction(agreementId, new Date(endDate), rent ? Number(rent) : undefined);
                  toast.success("Agreement renewed.");
                  setOpen(false);
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not renew agreement.");
                }
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Confirm renewal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
