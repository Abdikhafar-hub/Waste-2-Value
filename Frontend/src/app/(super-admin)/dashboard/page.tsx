"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Building2, Plus, UserPlus, Users } from "lucide-react";
import { ErrorState } from "@/components/platform/error-state";
import { KpiCard } from "@/components/platform/kpi-card";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { platformService } from "@/lib/services/platform-service";
import { formatDate, formatDateTime, roleLabel } from "@/lib/utils";

export default function SuperAdminDashboardPage() {
  const { data, loading, error, reload } = useAsyncResource(() => platformService.getDashboardData(), []);

  return (
    <div>
      <PageHeader
        title="Platform Dashboard"
        description="Executive overview of organizations, users, and onboarding momentum across the Waste2Value platform."
        actions={
          <>
            <Link href="/organizations">
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            </Link>
            <Link href="/users">
              <Button size="sm">
                <UserPlus className="h-4 w-4" />
                Create Org Admin
              </Button>
            </Link>
          </>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void reload()} /> : null}

      {loading || !data ? (
        <LoadingState rows={6} />
      ) : (
        <div className="space-y-4">
          <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
            <KpiCard
              label="Total Organizations"
              value={String(data.metrics.totalOrganizations)}
              trend="Platform footprint"
              icon={<Building2 className="h-4 w-4" />}
            />
            <KpiCard
              label="Active Orgs"
              value={String(data.metrics.activeOrganizations)}
              trend="Operational tenants"
              icon={<Activity className="h-4 w-4" />}
            />
            <KpiCard
              label="Suspended Orgs"
              value={String(data.metrics.suspendedOrganizations)}
              trend="Requires oversight"
              icon={<Activity className="h-4 w-4" />}
            />
            <KpiCard
              label="Platform Users"
              value={String(data.metrics.totalUsers)}
              trend="All roles"
              icon={<Users className="h-4 w-4" />}
            />
            <KpiCard
              label="New Users (30d)"
              value={String(data.metrics.newUsersThisPeriod)}
              trend="Recent onboarding"
              icon={<ArrowUpRight className="h-4 w-4" />}
            />
          </section>

          <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            <SectionCard
              title="Recent Organizations"
              subtitle="Newest tenant entries and readiness status"
              compact
            >
              <div className="space-y-2">
                {data.recentOrganizations.map((organization) => (
                  <Link
                    key={organization.id}
                    href={`/organizations/${organization.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition hover:bg-surface-soft"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{organization.name}</p>
                      <p className="text-xs text-muted-foreground">{organization.slug}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={organization.status} />
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(organization.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Users"
              subtitle="Latest platform users and role assignment"
              compact
            >
              <div className="space-y-2">
                {data.recentUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/users/${user.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition hover:bg-surface-soft"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">{roleLabel(user.role)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Audit Activity"
              subtitle="Latest governance and platform control events"
              compact
            >
              <div className="space-y-2">
                {data.recentAuditEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold text-foreground">{event.action.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.actorName} on {event.entityName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Quick Actions"
              subtitle="Most used super-admin actions"
              compact
            >
              <div className="grid gap-2">
                <Link href="/organizations">
                  <Button variant="secondary" className="w-full justify-start">
                    <Plus className="h-4 w-4" />
                    Register New Organization
                  </Button>
                </Link>
                <Link href="/users">
                  <Button variant="secondary" className="w-full justify-start">
                    <UserPlus className="h-4 w-4" />
                    Create Org Admin
                  </Button>
                </Link>
                <Link href="/audit">
                  <Button variant="secondary" className="w-full justify-start">
                    <Activity className="h-4 w-4" />
                    Review Audit Log
                  </Button>
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              title="Onboarding Readiness"
              subtitle="Progress snapshot for recent organizations"
              compact
            >
              <div className="space-y-2">
                {data.recentOrganizations.map((organization) => (
                  <div key={organization.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{organization.name}</p>
                      <p className="text-xs text-muted-foreground">{organization.readinessScore}%</p>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-surface-soft">
                      <div
                        className="h-2 rounded-full bg-brand"
                        style={{ width: `${organization.readinessScore}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{organization.onboardingStage.replaceAll("_", " ")}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>
        </div>
      )}
    </div>
  );
}
