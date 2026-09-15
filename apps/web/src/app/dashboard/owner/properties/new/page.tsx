import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NewPropertyForm } from "./new-property-form";

export default async function NewPropertyPage() {
  const subCities = await prisma.subCity.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Register a Property</CardTitle>
          <CardDescription>
            Submit your property for housing office review. Once approved, you can create rental agreements for it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewPropertyForm subCities={subCities} />
        </CardContent>
      </Card>
    </div>
  );
}
