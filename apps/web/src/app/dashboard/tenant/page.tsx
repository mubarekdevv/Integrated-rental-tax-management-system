import Link from "next/link";
import { FileText, Search, Receipt } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getTenantDashboard } from "@/lib/services/dashboard.service";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function TenantDashboardPage() {
  const session = await auth();
  const data = await getTenantDashboard(session!.user.id);

  if (!data.profileComplete) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert>
          <AlertTitle>Complete your profile</AlertTitle>
          <AlertDescription>Please provide your identity details to view or sign rental agreements.</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/tenant/profile">Complete profile</Link>
        </Button>
      </div>
    );
  }

  const { agreements, activeAgreement } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Welcome, {session!.user.firstName}</h1>
          <p className="text-sm text-muted-foreground">Your rental agreements and housing search, all in one place.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/properties">
            <Search className="size-4" /> Find a Home
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Agreements" value={agreements.length} icon={FileText} />
        <StatCard
          label="Current Rent"
          value={activeAgreement ? `${Number(activeAgreement.rentalAmountEtb).toLocaleString()} ETB` : "-"}
          icon={Receipt}
        />
        <StatCard label="Status" value={activeAgreement?.status.replaceAll("_", " ") ?? "No active agreement"} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Agreements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have a rental agreement yet.{" "}
              <Link href="/properties" className="underline">
                Search for a home
              </Link>
              .
            </p>
          ) : (
            agreements.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/tenant/agreements/${a.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{a.property.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.agreementNumber}</p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
