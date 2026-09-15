"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewPenaltyAction } from "@/server/actions/penalty";
import type { PenaltyDecision } from "@/lib/services/penalty.service";

export function ReviewPenaltyButtons({ penaltyId }: { penaltyId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(decision: PenaltyDecision) {
    startTransition(async () => {
      try {
        await reviewPenaltyAction(penaltyId, decision);
        toast.success(`Penalty ${decision.toLowerCase()}.`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("APPROVED")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run("WAIVED")}>
        <XCircle className="size-4" /> Waive
      </Button>
    </div>
  );
}
