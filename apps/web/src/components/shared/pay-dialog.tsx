"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

const PROVIDERS = ["CBE", "TELEBIRR", "BANK_TRANSFER", "CASH"];

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
  const t = useTranslations("payment");
  const tAuth = useTranslations("auth");

  const PROVIDER_LABELS: Record<string, string> = {
    CBE: t("providerCbe"),
    TELEBIRR: t("providerTelebirr"),
    BANK_TRANSFER: t("providerBankTransfer"),
    CASH: t("providerCash"),
  };

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
        toast.success(t("completedToast"));
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
          {label ?? t("payAmount", { amount: amountEtb.toLocaleString() })}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("makeAPayment")}</DialogTitle>
          <DialogDescription>
            {purpose.replaceAll("_", " ")} &middot; {amountEtb.toLocaleString()} ETB
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("provider")}</Label>
            <Select name="providerType" defaultValue="CBE">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PROVIDER_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payerPhone">{tAuth("phone")}</Label>
            <Input id="payerPhone" name="payerPhone" placeholder="0911234567" required />
            {result.fieldErrors?.payerPhone && <p className="text-sm text-destructive">{result.fieldErrors.payerPhone[0]}</p>}
          </div>
          {result.error && <p className="text-sm text-destructive">{result.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("confirmPayment")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
