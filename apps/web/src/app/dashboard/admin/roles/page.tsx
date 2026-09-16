import { Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/nav-config";
import type { UserRole } from "@/generated/prisma/enums";

const ROLES: UserRole[] = ["PROPERTY_OWNER", "TENANT", "HOUSING_OFFICER", "TAX_OFFICER", "SUPER_ADMIN"];
const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export default function AdminRolesPage() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="What each role is authorized to do, enforced server-side on every action." />
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Roles are fixed for this system (not runtime-editable) and defined centrally in code so every server
            action checks the same source of truth — see <code>src/lib/auth/permissions.ts</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  {ROLES.map((role) => (
                    <TableHead key={role} className="text-center">
                      {ROLE_LABELS[role]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_PERMISSIONS.map((permission) => (
                  <TableRow key={permission}>
                    <TableCell className="font-mono text-xs">{permission}</TableCell>
                    {ROLES.map((role) => (
                      <TableCell key={role} className="text-center">
                        {ROLE_PERMISSIONS[role].includes(permission) && (
                          <Check className="mx-auto size-4 text-emerald-600" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
