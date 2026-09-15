"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const t = useTranslations("auth");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        {state.fieldErrors?.email && <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
        {state.fieldErrors?.password && <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("login")}
      </Button>
    </form>
  );
}
