"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { updateAgreementPriceAction } from "@/server/actions/agreement";

export function UpdatePriceDialog({ agreementId, currentRentEtb }: { agreementId: string; currentRentEtb: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(currentRentEtb));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("agreement");
  const tCommon = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <TrendingUp className="size-4" /> {tCommon("updatePrice")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("updatePriceDialogTitle")}</DialogTitle>
          <DialogDescription>{t("updatePriceDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-rent">{t("newMonthlyRent")}</Label>
            <Input id="new-rent" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price-reason">{tCommon("reason")}</Label>
            <Textarea
              id="price-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("priceReasonPlaceholder")}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !reason || !amount}
            onClick={() =>
              startTransition(async () => {
                try {
                  await updateAgreementPriceAction(agreementId, Number(amount), reason);
                  toast.success(t("priceUpdatedToast"));
                  setOpen(false);
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : t("priceUpdateFailedToast"));
                }
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("saveNewPrice")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
