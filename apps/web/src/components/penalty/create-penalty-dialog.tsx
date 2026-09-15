"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createPenaltyAction } from "@/server/actions/penalty";

interface AgreementOption {
  id: string;
  label: string;
  responsiblePartyId: string;
  rentalAmountEtb: number;
}

interface PenaltyRuleOption {
  id: string;
  name: string;
  calculationType: string;
}

export function CreatePenaltyDialog({
  agreements,
  penaltyRules,
}: {
  agreements: AgreementOption[];
  penaltyRules: PenaltyRuleOption[];
}) {
  const [open, setOpen] = useState(false);
  const [agreementId, setAgreementId] = useState(agreements[0]?.id ?? "");
  const [ruleId, setRuleId] = useState(penaltyRules[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [delayDays, setDelayDays] = useState("0");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selectedAgreement = agreements.find((a) => a.id === agreementId);
  const selectedRule = penaltyRules.find((r) => r.id === ruleId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Record Penalty
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a Penalty</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Agreement</Label>
            <Select value={agreementId} onValueChange={(v) => setAgreementId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {agreements.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Penalty Rule</Label>
            <Select value={ruleId} onValueChange={(v) => setRuleId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {penaltyRules.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRule?.calculationType === "PER_DAY_LATE" && (
            <div className="space-y-2">
              <Label>Delay (days)</Label>
              <Input type="number" min={0} value={delayDays} onChange={(e) => setDelayDays(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the compliance issue..." />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !reason || !selectedAgreement}
            onClick={() =>
              startTransition(async () => {
                if (!selectedAgreement) return;
                try {
                  await createPenaltyAction({
                    penaltyRuleId: ruleId,
                    responsiblePartyId: selectedAgreement.responsiblePartyId,
                    reason,
                    delayDays: Number(delayDays) || undefined,
                    baseAmountEtb: selectedAgreement.rentalAmountEtb,
                    agreementId: selectedAgreement.id,
                  });
                  toast.success("Penalty recorded.");
                  setOpen(false);
                  setReason("");
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not record penalty.");
                }
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Record penalty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
