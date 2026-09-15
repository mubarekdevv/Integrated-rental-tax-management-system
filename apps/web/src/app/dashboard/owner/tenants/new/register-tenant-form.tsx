"use client";

import { useActionState } from "react";
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

  if (state.success) {
    return (
      <Alert>
        <CheckCircle2 className="size-4" />
        <AlertTitle>Tenant registered</AlertTitle>
        <AlertDescription>
          <p>
            Share these temporary credentials with the tenant so they can log in and complete their profile:
          </p>
          <p className="mt-2 font-mono text-sm">
            Email: {state.success.email}
            <br />
            Temporary password: {state.success.tempPassword}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" placeholder="0911234567" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ID Type</Label>
          <IdTypeSelect name="idType" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input id="idNumber" name="idNumber" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="motherName">Mother&apos;s Name (optional)</Label>
        <Input id="motherName" name="motherName" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Register tenant
      </Button>
    </form>
  );
}
