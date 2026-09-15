import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({ children }: LayoutProps<"/dashboard/admin">) {
  await requireRole("SUPER_ADMIN");
  return <>{children}</>;
}
