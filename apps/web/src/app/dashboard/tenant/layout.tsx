import { requireRole } from "@/lib/auth/require-role";

export default async function TenantLayout({ children }: LayoutProps<"/dashboard/tenant">) {
  await requireRole("TENANT");
  return <>{children}</>;
}
