"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubCitySelect } from "@/components/shared/sub-city-select";
import { createPriceRuleAction } from "@/server/actions/admin";
import type { ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

export function PriceRuleForm({ subCities }: { subCities: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(createPriceRuleAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error) {
      toast.success("Price rule added.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" placeholder="Bole apartments (sample)" required />
      </div>
      <div className="space-y-2">
        <Label>Sub-city (optional = citywide)</Label>
        <SubCitySelect name="subCityId" subCities={subCities} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minPriceEtb">Min Price (ETB)</Label>
        <Input id="minPriceEtb" name="minPriceEtb" type="number" min={0} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxPriceEtb">Max Price (ETB)</Label>
        <Input id="maxPriceEtb" name="maxPriceEtb" type="number" min={0} required />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2 w-fit">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Add rule
      </Button>
    </form>
  );
}
