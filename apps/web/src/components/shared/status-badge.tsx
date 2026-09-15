"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  CORRECTION_REQUIRED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  TERMINATED: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  INITIATED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  REFUNDED: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ASSESSED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  WAIVED: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DISPUTED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("status");
  const label = t.has(status) ? t(status) : status.replaceAll("_", " ");

  return (
    <Badge variant="outline" className={cn("gap-1.5 border-0 font-medium", STATUS_STYLES[status] ?? "bg-muted")}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </Badge>
  );
}
