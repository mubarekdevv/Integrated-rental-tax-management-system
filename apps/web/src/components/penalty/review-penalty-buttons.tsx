"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewPenaltyAction } from "@/server/actions/penalty";
import type { PenaltyDecision } from "@/lib/services/penalty.service";

export function ReviewPenaltyButtons({ penaltyId }: { penaltyId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("penalty");
  const tCommon = useTranslations("common");

  const TOASTS: Record<PenaltyDecision, string> = {
    APPROVED: t("approveToast"),
    WAIVED: t("waivedToast"),
    DISPUTED: t("disputedToast"),
  };

  function run(decision: PenaltyDecision) {
    startTransition(async () => {
      try {
        await reviewPenaltyAction(penaltyId, decision);
        toast.success(TOASTS[decision]);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tCommon("actionFailed"));
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("APPROVED")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {tCommon("approve")}
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run("WAIVED")}>
        <XCircle className="size-4" /> {tCommon("waive")}
      </Button>
    </div>
  );
}
