"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Check, X, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { reviewAgreementAction } from "@/server/actions/agreement";
import type { AgreementReviewDecision } from "@/lib/services/agreement.service";

export function ReviewAgreementButtons({ agreementId }: { agreementId: string }) {
  const [pending, startTransition] = useTransition();
  const [dialogDecision, setDialogDecision] = useState<AgreementReviewDecision | null>(null);
  const [comment, setComment] = useState("");
  const router = useRouter();
  const t = useTranslations("agreement");
  const tCommon = useTranslations("common");

  const TOASTS: Record<AgreementReviewDecision, string> = {
    APPROVED: t("approveToast"),
    REJECTED: t("rejectToast"),
    CORRECTION_REQUIRED: t("correctionRequestedToast"),
  };

  function run(decision: AgreementReviewDecision, note?: string) {
    startTransition(async () => {
      try {
        await reviewAgreementAction(agreementId, decision, note);
        toast.success(TOASTS[decision]);
        setDialogDecision(null);
        setComment("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tCommon("actionFailed"));
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("APPROVED")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        {tCommon("approve")}
      </Button>

      <Dialog open={dialogDecision === "CORRECTION_REQUIRED"} onOpenChange={(open) => setDialogDecision(open ? "CORRECTION_REQUIRED" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            <MessageSquareWarning className="size-4" /> {tCommon("requestCorrection")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon("requestCorrection")}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder={t("correctionDialogPlaceholder")} value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button disabled={pending || !comment} onClick={() => run("CORRECTION_REQUIRED", comment)}>
              {tCommon("send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogDecision === "REJECTED"} onOpenChange={(open) => setDialogDecision(open ? "REJECTED" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            <X className="size-4" /> {tCommon("reject")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder={t("rejectDialogPlaceholder")} value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button variant="destructive" disabled={pending || !comment} onClick={() => run("REJECTED", comment)}>
              {tCommon("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
