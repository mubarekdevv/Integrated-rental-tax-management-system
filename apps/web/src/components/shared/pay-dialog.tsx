"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { initiatePaymentAction } from "@/server/actions/payment";
import type { ActionFormState } from "@/server/actions/auth";
import type { PaymentPurpose } from "@/generated/prisma/enums";

const PROVIDERS = [
  { value: "CBE", label: "Commercial Bank of Ethiopia" },
  { value: "TELEBIRR", label: "telebirr" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
];

export function PayDialog({
  purpose,
  amountEtb,
  agreementId,
  taxAssessmentId,
  penaltyId,
  label,
}: {
  purpose: PaymentPurpose;
  amountEtb: number;
  agreementId?: string;
  taxAssessmentId?: string;
  penaltyId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ActionFormState>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const outcome = await initiatePaymentAction(
        { purpose, amountEtb, agreementId, taxAssessmentId, penaltyId },
        undefined,
        formData
      );
      setResult(outcome);
      if (!outcome.error && !outcome.fieldErrors) {
        toast.success("Payment completed.");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CreditCard className="size-4" />
          {label ?? `Pay ${amountEtb.toLocaleString()} ETB`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a Payment</DialogTitle>
          <DialogDescription>
            {purpose.replaceAll("_", " ")} &middot; {amountEtb.toLocaleString()} ETB
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Payment Provider</Label>
            <Select name="providerType" defaultValue="CBE">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payerPhone">Phone Number</Label>
            <Input id="payerPhone" name="payerPhone" placeholder="0911234567" required />
            {result.fieldErrors?.payerPhone && <p className="text-sm text-destructive">{result.fieldErrors.payerPhone[0]}</p>}
          </div>
          {result.error && <p className="text-sm text-destructive">{result.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Confirm payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
