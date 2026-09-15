"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="size-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message || "An unexpected error occurred while loading this page."}</p>
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
