"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/server/actions/admin";

export function ToggleUserActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant={isActive ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleUserActiveAction(userId);
            toast.success(isActive ? "User deactivated." : "User activated.");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Action failed.");
          }
        })
      }
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
