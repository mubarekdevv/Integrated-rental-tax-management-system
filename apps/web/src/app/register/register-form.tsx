"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { registerAction, type ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);
  const [role, setRole] = useState<"PROPERTY_OWNER" | "TENANT">("PROPERTY_OWNER");

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label>I am registering as</Label>
        <RadioGroup
          name="role"
          value={role}
          onValueChange={(value) => setRole(value as typeof role)}
          className="grid grid-cols-2 gap-2"
        >
          <Label
            htmlFor="role-owner"
            className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem id="role-owner" value="PROPERTY_OWNER" />
            Property Owner
          </Label>
          <Label
            htmlFor="role-tenant"
            className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem id="role-tenant" value="TENANT" />
            Tenant
          </Label>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" required />
          {state.fieldErrors?.firstName && <p className="text-sm text-destructive">{state.fieldErrors.firstName[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" required />
          {state.fieldErrors?.lastName && <p className="text-sm text-destructive">{state.fieldErrors.lastName[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="middleName">Middle Name (optional)</Label>
        <Input id="middleName" name="middleName" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {state.fieldErrors?.email && <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" placeholder="0911234567" required />
        {state.fieldErrors?.phone && <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
        {state.fieldErrors?.password && <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>}
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
