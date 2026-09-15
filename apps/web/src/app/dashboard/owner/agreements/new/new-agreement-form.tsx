"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAgreementAction } from "@/server/actions/agreement";
import type { ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

interface PropertyOption {
  id: string;
  title: string;
  code: string;
  askingRentEtb: number;
}

export function NewAgreementForm({
  properties,
  defaultPropertyId,
}: {
  properties: PropertyOption[];
  defaultPropertyId?: string;
}) {
  const [state, action, pending] = useActionState(createAgreementAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error && !state.fieldErrors) {
      toast.success("Agreement submitted for housing review.");
      router.push("/dashboard/owner/agreements");
    }
  }, [state, router]);

  const defaultProperty = properties.find((p) => p.id === defaultPropertyId) ?? properties[0];

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label>Property</Label>
        <Select name="propertyId" defaultValue={defaultProperty?.id}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title} ({p.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenantIdentifier">Tenant (phone, email or ID number)</Label>
        <Input id="tenantIdentifier" name="tenantIdentifier" placeholder="0933000001" required />
        {state.fieldErrors?.tenantIdentifier && (
          <p className="text-sm text-destructive">{state.fieldErrors.tenantIdentifier[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" name="endDate" type="date" required />
          {state.fieldErrors?.endDate && <p className="text-sm text-destructive">{state.fieldErrors.endDate[0]}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rentalAmountEtb">Monthly Rent (ETB)</Label>
          <Input
            id="rentalAmountEtb"
            name="rentalAmountEtb"
            type="number"
            min={0}
            defaultValue={defaultProperty?.askingRentEtb}
            required
          />
          {state.fieldErrors?.rentalAmountEtb && (
            <p className="text-sm text-destructive">{state.fieldErrors.rentalAmountEtb[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Payment Frequency</Label>
          <Select name="paymentFrequency" defaultValue="MONTHLY">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="SEMI_ANNUAL">Semi-Annual</SelectItem>
              <SelectItem value="ANNUAL">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Submit agreement for review
      </Button>
    </form>
  );
}
