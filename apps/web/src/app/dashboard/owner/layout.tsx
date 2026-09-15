import { requireRole } from "@/lib/auth/require-role";

export default async function OwnerLayout({ children }: LayoutProps<"/dashboard/owner">) {
  await requireRole("PROPERTY_OWNER");
  return <>{children}</>;
}
