"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { requestTerminationAction, approveTerminationAction } from "@/server/actions/agreement";

export function RequestTerminationButton({ agreementId }: { agreementId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <LogOut className="size-4" /> Request Termination
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Termination</DialogTitle>
        </DialogHeader>
        <Textarea placeholder="Reason for terminating this agreement..." value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button
            disabled={pending || !reason}
            onClick={() =>
              startTransition(async () => {
                try {
                  await requestTerminationAction(agreementId, reason);
                  toast.success("Termination requested.");
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not request termination.");
                }
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApproveTerminationButton({ agreementId }: { agreementId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await approveTerminationAction(agreementId);
            toast.success("Agreement terminated.");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not terminate.");
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
      Approve Termination
    </Button>
  );
}
