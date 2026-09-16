"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPenaltyRuleAction } from "@/server/actions/admin";
import type { ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

export function PenaltyRuleForm() {
  const [state, action, pending] = useActionState(createPenaltyRuleAction, initialState);
  const router = useRouter();
  const [calculationType, setCalculationType] = useState("FIXED");

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error) {
      toast.success("Penalty rule added.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Select name="reasonCode" defaultValue="NON_COMPLIANCE">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DELAYED_REGISTRATION">Delayed Registration</SelectItem>
            <SelectItem value="NON_COMPLIANCE">Non-Compliance</SelectItem>
            <SelectItem value="LATE_TAX_PAYMENT">Late Tax Payment</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Calculation</Label>
        <Select name="calculationType" value={calculationType} onValueChange={(v) => setCalculationType(v ?? "FIXED")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">Fixed Amount</SelectItem>
            <SelectItem value="PERCENTAGE_OF_RENT">Percentage of Rent</SelectItem>
            <SelectItem value="PER_DAY_LATE">Per Day Late</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {calculationType === "FIXED" && (
        <div className="space-y-2">
          <Label htmlFor="fixedAmountEtb">Fixed Amount (ETB)</Label>
          <Input id="fixedAmountEtb" name="fixedAmountEtb" type="number" min={0} />
        </div>
      )}
      {calculationType === "PERCENTAGE_OF_RENT" && (
        <div className="space-y-2">
          <Label htmlFor="percentage">Percentage (%)</Label>
          <Input id="percentage" name="percentage" type="number" min={0} step="0.1" />
        </div>
      )}
      {calculationType === "PER_DAY_LATE" && (
        <div className="space-y-2">
          <Label htmlFor="perDayAmountEtb">Per Day (ETB)</Label>
          <Input id="perDayAmountEtb" name="perDayAmountEtb" type="number" min={0} />
        </div>
      )}
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2 w-fit">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Add rule
      </Button>
    </form>
  );
}
