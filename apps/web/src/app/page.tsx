import Link from "next/link";
import { Search, ShieldCheck, FileCheck2, Receipt } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { PublicHeader } from "@/components/shared/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const [propertyCount, agreementCount, subCityCount] = await Promise.all([
    prisma.property.count({ where: { isListed: true, status: "APPROVED" } }),
    prisma.rentalAgreement.count({ where: { status: "ACTIVE" } }),
    prisma.subCity.count(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Digital House Rental &amp; Tax Management
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A single, government-backed platform connecting property owners, tenants, housing offices and tax
            authorities — from property registration to rental agreement, service fees, the contract agreement and
            tax compliance.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/properties">
                <Search className="size-4" /> Find a Home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Register as an Owner</Link>
            </Button>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-sm">
            <Stat label="Available Homes" value={propertyCount} />
            <Stat label="Active Agreements" value={agreementCount} />
            <Stat label="Sub-cities Covered" value={subCityCount} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
        <Feature
          icon={FileCheck2}
          title="Digital Rental Agreements"
          description="Register properties, create agreements and issue a verifiable contract agreement with a QR code — end to end."
        />
        <Feature
          icon={Receipt}
          title="Transparent Tax & Fees"
          description="Tax is calculated from a configurable rule, not hard-coded logic, so authorities can update rates as policy changes."
        />
        <Feature
          icon={ShieldCheck}
          title="Accountable by Design"
          description="Role-based access and a full audit trail mean every approval, payment and change is tracked and attributable."
        />
      </section>

      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
        Integrated Digital House Rental and Tax Management System — student project prototype.
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-2">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
