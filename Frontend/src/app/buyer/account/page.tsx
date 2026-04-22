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
import { buyerService } from "@/lib/services/buyer-service";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function BuyerAccountPage() {
  const profile = useAsyncResource(() => buyerService.getAccountProfile(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Account"
        description="Profile context, buyer role visibility, and account preferences."
      />

      {profile.error ? <ErrorState message={profile.error} onRetry={() => void profile.reload()} /> : null}

      {profile.loading || !profile.data ? (
        <LoadingState rows={6} />
      ) : (
        <>
          <SectionCard title={`${profile.data.firstName} ${profile.data.lastName}`} subtitle={profile.data.email}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Role" value={profile.data.role} />
              <StatBlock label="Organization" value={profile.data.organizationName} />
              <StatBlock label="Joined" value={formatDate(profile.data.joinedAt)} />
              <StatBlock label="Phone" value={profile.data.phone ?? "Not provided"} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={profile.data.status} />
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                Last active {formatDateTime(profile.data.lastActiveAt)}
              </span>
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Security" subtitle="Buyer access and account protection" compact>
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-brand" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Password</p>
                      <p className="text-xs text-muted-foreground">Security update placeholder</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Update</Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Preferences" subtitle="Order and notification behavior" compact>
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-brand" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground">Order and delivery alert preferences placeholder</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Configure</Button>
                </div>
              </div>
            </SectionCard>
          </section>
        </>
      )}
    </div>
  );
}
