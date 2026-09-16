"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitPropertyAction } from "@/server/actions/property";

export function SubmitPropertyButton({ propertyId }: { propertyId: string }) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("property");

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await submitPropertyAction(propertyId);
            toast.success(t("submitForReviewToast"));
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t("submitFailedToast"));
          }
        })
      }
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {t("submitForReview")}
    </Button>
  );
}
