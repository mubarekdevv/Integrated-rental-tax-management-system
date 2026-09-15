import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getAgreementDetail } from "@/lib/services/agreement-detail.service";
import { AgreementDetailView } from "@/components/agreement/agreement-detail-view";

export default async function OwnerAgreementDetailPage({ params }: PageProps<"/dashboard/owner/agreements/[id]">) {
  const { id } = await params;
  const session = await auth();
  const agreement = await getAgreementDetail(id);
  if (!agreement) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <AgreementDetailView agreement={agreement} viewerRole={session!.user.role} />
    </div>
  );
}
