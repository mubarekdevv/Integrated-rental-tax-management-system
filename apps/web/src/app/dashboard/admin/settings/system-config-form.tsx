"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSystemConfigAction } from "@/server/actions/admin";
import type { ActionFormState } from "@/server/actions/auth";

const initialState: ActionFormState = {};

export function SystemConfigForm({
  configKey,
  value,
  description,
}: {
  configKey: string;
  value: string;
  description?: string | null;
}) {
  const [state, action, pending] = useActionState(updateSystemConfigAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state === initialState) return;
    if (!state.error) {
      toast.success(`${configKey} updated.`);
      router.refresh();
    }
  }, [state, router, configKey]);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="key" value={configKey} />
      <div className="space-y-1">
        <Label htmlFor={`value-${configKey}`}>{configKey.replaceAll("_", " ")}</Label>
        <Input id={`value-${configKey}`} name="value" defaultValue={value} className="w-32" />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save
      </Button>
    </form>
  );
}
