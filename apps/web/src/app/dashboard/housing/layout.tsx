import { requireRole } from "@/lib/auth/require-role";

export default async function HousingLayout({ children }: LayoutProps<"/dashboard/housing">) {
  await requireRole("HOUSING_OFFICER");
  return <>{children}</>;
}
