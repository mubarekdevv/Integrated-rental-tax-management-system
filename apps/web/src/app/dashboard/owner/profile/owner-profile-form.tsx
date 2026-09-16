"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdTypeSelect } from "@/components/shared/id-type-select";
import { completeOwnerProfileAction } from "@/server/actions/profile";
import type { ActionFormState } from "@/server/actions/auth";
import type { OwnerProfile } from "@/generated/prisma/client";

const initialState: ActionFormState = {};

export function OwnerProfileForm({ profile }: { profile: OwnerProfile | null }) {
  const [state, action, pending] = useActionState(completeOwnerProfileAction, initialState);

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error && !state.fieldErrors) toast.success("Profile saved.");
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ID Type</Label>
          <IdTypeSelect name="idType" defaultValue={profile?.idType} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input id="idNumber" name="idNumber" defaultValue={profile?.idNumber} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subCity">Sub-city (residence)</Label>
          <Input id="subCity" name="subCity" defaultValue={profile?.subCity ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="woreda">Woreda</Label>
          <Input id="woreda" name="woreda" defaultValue={profile?.woreda ?? ""} />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save profile
      </Button>
    </form>
  );
}
