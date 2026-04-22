"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { platformService } from "@/lib/services/platform-service";
import { formatDate, formatDateTime, roleLabel } from "@/lib/utils";

export default function AccountPage() {
  const profile = useAsyncResource(() => platformService.getAccountProfile(), []);

  return (
    <div>
      <PageHeader
        title="Account"
        description="Your platform profile, role identity, and account security posture."
      />

      {profile.error ? <ErrorState message={profile.error} onRetry={() => void profile.reload()} /> : null}

      {profile.loading || !profile.data ? (
        <LoadingState rows={5} />
      ) : (
        <div className="space-y-4">
          <SectionCard title={`${profile.data.firstName} ${profile.data.lastName}`} subtitle={profile.data.email}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Role" value={roleLabel(profile.data.role)} />
              <StatBlock label="Status" value={profile.data.status} />
              <StatBlock label="Created" value={formatDate(profile.data.createdAt)} />
              <StatBlock
                label="Last Active"
                value={profile.data.lastActiveAt ? formatDateTime(profile.data.lastActiveAt) : "-"}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={profile.data.status} />
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                Platform-level access
              </span>
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Security" subtitle="Password and authentication controls" compact>
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-brand" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Password</p>
                        <p className="text-xs text-muted-foreground">Last changed 27 days ago</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">Update</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Multi-factor auth</p>
                        <p className="text-xs text-muted-foreground">Not enforced yet (placeholder)</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Sessions" subtitle="Recent security sessions and controls" compact>
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">Current Session</p>
                <p className="mt-1 text-xs text-muted-foreground">Nairobi, Kenya • Chrome • Active now</p>
              </div>
              <div className="mt-2 rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                Additional session controls are prepared as placeholders for backend integration.
              </div>
            </SectionCard>
          </section>
        </div>
      )}
    </div>
  );
}
