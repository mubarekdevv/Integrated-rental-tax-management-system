import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RegisterTenantForm } from "./register-tenant-form";

export default function NewTenantPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Register a Tenant</CardTitle>
          <CardDescription>
            Register a tenant directly if they haven&apos;t created their own account yet. A temporary password will
            be generated for them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterTenantForm />
        </CardContent>
      </Card>
    </div>
  );
}
