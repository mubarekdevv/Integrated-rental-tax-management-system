import { requireRole } from "@/lib/auth/require-role";

export default async function TaxLayout({ children }: LayoutProps<"/dashboard/tax">) {
  await requireRole("TAX_OFFICER");
  return <>{children}</>;
}
