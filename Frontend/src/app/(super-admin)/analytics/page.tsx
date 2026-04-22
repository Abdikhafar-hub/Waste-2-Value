"use client";

import { BarChart3 } from "lucide-react";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { platformService } from "@/lib/services/platform-service";
import { roleLabel } from "@/lib/utils";

export default function AnalyticsPage() {
  const analytics = useAsyncResource(() => platformService.getAnalyticsSummary(), []);

  return (
    <div>
      <PageHeader
        title="Platform Analytics"
        description="High-level metrics for organization growth, user growth, and onboarding health."
      />

      {analytics.error ? <ErrorState message={analytics.error} onRetry={() => void analytics.reload()} /> : null}

      {analytics.loading || !analytics.data ? (
        <LoadingState rows={6} />
      ) : (
        <div className="space-y-4">
          <section className="grid gap-3 lg:grid-cols-3">
            <StatBlock label="Onboarding Completed" value={String(analytics.data.onboarding.completed)} />
            <StatBlock label="Onboarding In Progress" value={String(analytics.data.onboarding.inProgress)} />
            <StatBlock label="Onboarding Pending" value={String(analytics.data.onboarding.pending)} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Organization & User Growth" subtitle="Monthly trendline summary" compact>
              <div className="space-y-3">
                {analytics.data.growth.map((point) => (
                  <div key={point.label} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>{point.label}</span>
                      <span>{point.organizations} orgs / {point.users} users</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="mb-1 text-[11px] text-muted-foreground">Organizations</p>
                        <div className="h-2 w-full rounded-full bg-surface-soft">
                          <div className="h-2 rounded-full bg-brand" style={{ width: `${point.organizations * 10}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] text-muted-foreground">Users</p>
                        <div className="h-2 w-full rounded-full bg-surface-soft">
                          <div
                            className="h-2 rounded-full bg-[#2f9263]"
                            style={{ width: `${Math.min(point.users, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Role Distribution" subtitle="Current platform user role mix" compact>
              <div className="space-y-2">
                {analytics.data.roleDistribution.map((role) => (
                  <div key={role.role} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{roleLabel(role.role)}</p>
                      <p className="text-xs text-muted-foreground">{role.value} users</p>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-surface-soft">
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${role.value * 12}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>

          <SectionCard title="Analytics Notes" subtitle="Summary for stakeholder readouts" compact>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-4">
              <BarChart3 className="h-5 w-5 text-brand" />
              <div className="text-sm text-muted-foreground">
                Organization growth is steady with onboarding in progress for most new tenants. Role mix is
                concentrated around ORG_ADMIN and operational field roles, with stable super-admin coverage.
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
