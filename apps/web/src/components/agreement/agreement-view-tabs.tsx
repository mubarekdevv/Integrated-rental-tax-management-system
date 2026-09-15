import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All", href: "/dashboard/housing/agreements" },
  { key: "active", label: "Active", href: "/dashboard/housing/agreements/active" },
] as const;

export function AgreementViewTabs({ active }: { active: "all" | "active" }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href as never}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
