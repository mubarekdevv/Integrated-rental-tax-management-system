import Link from "next/link";
import { Building2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-7" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-1 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to view it.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Building2 className="size-4" /> Back to Home
        </Link>
      </Button>
    </div>
  );
}
