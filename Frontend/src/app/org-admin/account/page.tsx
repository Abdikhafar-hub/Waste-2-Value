"use client";

import { KeyRound, SlidersHorizontal } from "lucide-react";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function OrgAdminAccountPage() {
  const profile = useAsyncResource(() => orgAdminService.getAccountProfile(), []);

  return (
    <div className="space-y-4">
      <PageHeader title="Account" description="Profile identity, organization context, and security preferences." />

      {profile.error ? <ErrorState message={profile.error} onRetry={() => void profile.reload()} /> : null}

      {profile.loading || !profile.data ? (
        <LoadingState rows={6} />
      ) : (
        <>
          <SectionCard title={`${profile.data.firstName} ${profile.data.lastName}`} subtitle={profile.data.email}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Role" value={profile.data.role.replaceAll("_", " ")} />
              <StatBlock label="Organization" value={profile.data.organizationName} />
              <StatBlock label="Joined" value={formatDate(profile.data.joinedAt)} />
              <StatBlock label="Last Active" value={formatDateTime(profile.data.lastActiveAt)} />
            </div>
            <div className="mt-3"><StatusBadge status={profile.data.status} /></div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Security" subtitle="Authentication controls" compact>
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-brand" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Password</p>
                        <p className="text-xs text-muted-foreground">Last changed 19 days ago</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">Update</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                  Session management and MFA controls are prepared as integration placeholders.
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Preferences" subtitle="Personal workspace settings" compact>
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-brand" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Operational alerts</p>
                        <p className="text-xs text-muted-foreground">Receive notifications for queue and redemptions</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </section>
        </>
      )}
    </div>
  );
}
