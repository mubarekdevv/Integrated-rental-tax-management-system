"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTaxRuleAction } from "@/server/actions/admin";
import type { ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

export function TaxRuleForm() {
  const [state, action, pending] = useActionState(createTaxRuleAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error) {
      toast.success("Tax rule updated.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Rental Income Tax" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ratePercentage">Rate (%)</Label>
        <Input id="ratePercentage" name="ratePercentage" type="number" step="0.1" min={0} placeholder="11.5" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save rate
      </Button>
    </form>
  );
}
