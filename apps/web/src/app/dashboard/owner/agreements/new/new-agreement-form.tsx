"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("agreement");
  const tEnumFrequency = useTranslations("enums.paymentFrequency");

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error && !state.fieldErrors) {
      toast.success(t("submittedForReviewToast"));
      router.push("/dashboard/owner/agreements");
    }
  }, [state, router, t]);

  const defaultProperty = properties.find((p) => p.id === defaultPropertyId) ?? properties[0];

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("selectProperty")}</Label>
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
        <Label htmlFor="tenantIdentifier">{t("tenantIdentifier")}</Label>
        <Input id="tenantIdentifier" name="tenantIdentifier" placeholder="0933000001" required />
        {state.fieldErrors?.tenantIdentifier && (
          <p className="text-sm text-destructive">{state.fieldErrors.tenantIdentifier[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t("startDate")}</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t("endDate")}</Label>
          <Input id="endDate" name="endDate" type="date" required />
          {state.fieldErrors?.endDate && <p className="text-sm text-destructive">{state.fieldErrors.endDate[0]}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rentalAmountEtb">{t("monthlyRent")}</Label>
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
          <Label>{t("paymentFrequency")}</Label>
          <Select name="paymentFrequency" defaultValue="MONTHLY">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">{tEnumFrequency("MONTHLY")}</SelectItem>
              <SelectItem value="QUARTERLY">{tEnumFrequency("QUARTERLY")}</SelectItem>
              <SelectItem value="SEMI_ANNUAL">{tEnumFrequency("SEMI_ANNUAL")}</SelectItem>
              <SelectItem value="ANNUAL">{tEnumFrequency("ANNUAL")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("submitForReviewCta")}
      </Button>
    </form>
  );
}
