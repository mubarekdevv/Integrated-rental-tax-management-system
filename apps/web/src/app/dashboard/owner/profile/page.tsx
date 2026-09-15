import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OwnerProfileForm } from "./owner-profile-form";

export default async function OwnerProfilePage() {
  const session = await auth();
  const ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: session!.user.id } });

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Your identity details are required to register properties and sign agreements.</CardDescription>
        </CardHeader>
        <CardContent>
          <OwnerProfileForm profile={ownerProfile} />
          {ownerProfile?.isVerified && (
            <p className="mt-4 text-sm text-emerald-600">Verified by a housing officer.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
