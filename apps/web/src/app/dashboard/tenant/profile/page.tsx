import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TenantProfileForm } from "./tenant-profile-form";

export default async function TenantProfilePage() {
  const session = await auth();
  const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId: session!.user.id } });

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Your identity details are required before you can be added to a rental agreement.</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantProfileForm profile={tenantProfile} />
          {tenantProfile?.isVerified && <p className="mt-4 text-sm text-emerald-600">Verified by a housing officer.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
