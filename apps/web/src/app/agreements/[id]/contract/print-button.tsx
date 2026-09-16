"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("contract");
  return (
    <Button onClick={() => window.print()}>
      <Printer className="size-4" /> {t("printSavePdf")}
    </Button>
  );
}
