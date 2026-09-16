import { Users, Home, FileText, Percent } from "lucide-react";
import { getAdminDashboard } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleDistributionChart } from "@/components/shared/role-distribution-chart";
import { PageHeader } from "@/components/shared/page-header";
import { ROLE_LABELS } from "@/lib/nav-config";
import type { UserRole } from "@/generated/prisma/enums";

export default async function AdminDashboardPage() {
  const { userCounts, propertyCount, agreementCount, auditLogs, taxRule } = await getAdminDashboard();
  const totalUsers = userCounts.reduce((sum, r) => sum + r._count, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="System Overview" description="Users, activity and configuration at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers} icon={Users} />
        <StatCard label="Properties" value={propertyCount} icon={Home} />
        <StatCard label="Agreements" value={agreementCount} icon={FileText} />
        <StatCard
          label="Tax Brackets"
          value={
            taxRule && taxRule.brackets.length > 0
              ? `${taxRule.brackets.length} (0–${Number(taxRule.brackets[taxRule.brackets.length - 1].ratePercentage)}%)`
              : "Not set"
          }
          icon={Percent}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleDistributionChart
            data={userCounts.map((r) => ({ role: ROLE_LABELS[r.role as UserRole], count: r._count }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Log Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  {log.entityType} &middot; {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{log.createdAt.toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
