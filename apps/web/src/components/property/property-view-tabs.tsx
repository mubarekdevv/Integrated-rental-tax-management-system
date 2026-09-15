import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All", href: "/dashboard/housing/properties" },
  { key: "pending", label: "Pending Review", href: "/dashboard/housing/properties/pending" },
  { key: "approved", label: "Approved", href: "/dashboard/housing/properties/approved" },
] as const;

export function PropertyViewTabs({ active }: { active: "all" | "pending" | "approved" }) {
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
