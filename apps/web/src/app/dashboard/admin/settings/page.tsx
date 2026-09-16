import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SystemConfigForm } from "./system-config-form";

export default async function AdminSettingsPage() {
  const configs = await prisma.systemConfiguration.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">System Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Operational parameters that should be adjustable without a code change, such as the service fee
            percentage and the tax payment grace period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configs.map((c) => (
            <div key={c.key} className="rounded-md border p-3">
              <SystemConfigForm configKey={c.key} value={String(c.value)} description={c.description} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
