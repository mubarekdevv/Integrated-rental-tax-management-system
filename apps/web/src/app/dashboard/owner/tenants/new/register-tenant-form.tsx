"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdTypeSelect } from "@/components/shared/id-type-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerTenantByOwnerAction, type RegisterTenantState } from "@/server/actions/profile";

const initialState: RegisterTenantState = {};

export function RegisterTenantForm() {
  const [state, action, pending] = useActionState(registerTenantByOwnerAction, initialState);
  const t = useTranslations("tenant");
  const tAuth = useTranslations("auth");
  const tProfile = useTranslations("profile");

  if (state.success) {
    return (
      <Alert>
        <CheckCircle2 className="size-4" />
        <AlertTitle>{t("registeredTitle")}</AlertTitle>
        <AlertDescription>
          <p>{t("credentialsShare")}</p>
          <p className="mt-2 font-mono text-sm">
            {tAuth("email")}: {state.success.email}
            <br />
            {t("tempPassword")}: {state.success.tempPassword}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">{tAuth("firstName")}</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{tAuth("lastName")}</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{tAuth("email")}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{tAuth("phone")}</Label>
        <Input id="phone" name="phone" placeholder="0911234567" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{tProfile("idType")}</Label>
          <IdTypeSelect name="idType" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">{tProfile("idNumber")}</Label>
          <Input id="idNumber" name="idNumber" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="motherName">{tProfile("motherName")}</Label>
        <Input id="motherName" name="motherName" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("registerCta")}
      </Button>
    </form>
  );
}
