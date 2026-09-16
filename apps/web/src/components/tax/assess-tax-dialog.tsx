"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { assessTaxAction } from "@/server/actions/tax";

export function AssessTaxDialog({
  agreementId,
  defaultStart,
  defaultEnd,
}: {
  agreementId: string;
  defaultStart: string;
  defaultEnd: string;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("tax");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Receipt className="size-4" /> {t("assess")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assessDialogTitle")}</DialogTitle>
          <DialogDescription>{t("assessDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("periodStart")}</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("periodEnd")}</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await assessTaxAction(agreementId, new Date(start), new Date(end));
                  toast.success(t("assessedToast"));
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : t("assessFailedToast"));
                }
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("assessCta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
