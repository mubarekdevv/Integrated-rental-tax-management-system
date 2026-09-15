"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitPropertyAction } from "@/server/actions/property";

export function SubmitPropertyButton({ propertyId }: { propertyId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await submitPropertyAction(propertyId);
            toast.success("Property submitted for housing review.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not submit.");
          }
        })
      }
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      Submit for Review
    </Button>
  );
}
