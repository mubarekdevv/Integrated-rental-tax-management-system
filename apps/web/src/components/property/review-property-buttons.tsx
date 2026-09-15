"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, X, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { reviewPropertyAction } from "@/server/actions/property";
import type { PropertyReviewDecision } from "@/lib/services/property.service";

export function ReviewPropertyButtons({ propertyId }: { propertyId: string }) {
  const [pending, startTransition] = useTransition();
  const [dialogDecision, setDialogDecision] = useState<PropertyReviewDecision | null>(null);
  const [comment, setComment] = useState("");
  const router = useRouter();

  function run(decision: PropertyReviewDecision, note?: string) {
    startTransition(async () => {
      try {
        await reviewPropertyAction(propertyId, decision, note);
        toast.success(`Property ${decision.toLowerCase().replaceAll("_", " ")}.`);
        setDialogDecision(null);
        setComment("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("APPROVED")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Approve
      </Button>

      <Dialog open={dialogDecision === "CORRECTION_REQUIRED"} onOpenChange={(open) => setDialogDecision(open ? "CORRECTION_REQUIRED" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            <MessageSquareWarning className="size-4" /> Request Correction
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Correction</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Explain what needs to be corrected..." value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button disabled={pending || !comment} onClick={() => run("CORRECTION_REQUIRED", comment)}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogDecision === "REJECTED"} onOpenChange={(open) => setDialogDecision(open ? "REJECTED" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            <X className="size-4" /> Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection..." value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button variant="destructive" disabled={pending || !comment} onClick={() => run("REJECTED", comment)}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
