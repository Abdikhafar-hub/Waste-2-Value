"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { platformService } from "@/lib/services/platform-service";
import { formatDate, formatDateTime, roleLabel } from "@/lib/utils";

export function UserDetailView({ userId }: { userId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const detail = useAsyncResource(() => platformService.getPlatformUserById(userId), [userId]);
  const toggleStatusAction = useAsyncAction(() => platformService.toggleUserStatus(userId));

  const handleToggle = async () => {
    await toggleStatusAction.execute();
    setConfirmOpen(false);
    await detail.reload();
  };

  return (
    <div>
      <PageHeader
        title="Platform User Detail"
        description="Profile, account state, and governance visibility for an individual platform user."
        actions={
          <>
            <Link href="/users">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button
              variant={detail.data?.user.status === "SUSPENDED" ? "secondary" : "danger"}
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={detail.data?.user.role === "SUPER_ADMIN"}
            >
              {detail.data?.user.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
            </Button>
          </>
        }
      />

      {detail.error ? <ErrorState message={detail.error} onRetry={() => void detail.reload()} /> : null}

      {detail.loading || !detail.data ? (
        <LoadingState rows={6} />
      ) : (
        <div className="space-y-4">
          <SectionCard
            title={`${detail.data.user.firstName} ${detail.data.user.lastName}`}
            subtitle={detail.data.user.email}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Role" value={roleLabel(detail.data.user.role)} />
              <StatBlock label="Organization" value={detail.data.user.organizationName ?? "Platform"} />
              <StatBlock label="Status" value={detail.data.user.status.replaceAll("_", " ")} />
              <StatBlock label="Created" value={formatDate(detail.data.user.createdAt)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.data.user.status} />
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                Last active {detail.data.user.lastActiveAt ? formatDateTime(detail.data.user.lastActiveAt) : "-"}
              </span>
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Account State" subtitle="Security and access posture" compact>
              <div className="space-y-2">
                <StatBlock
                  label="Status"
                  value={detail.data.user.status.replaceAll("_", " ")}
                  helper="Controlled at platform level"
                />
                <StatBlock label="Role Scope" value={roleLabel(detail.data.user.role)} />
                <StatBlock label="Phone" value={detail.data.user.phone ?? "Not provided"} />
              </div>
            </SectionCard>

            <SectionCard title="Recent Activity" subtitle="Latest platform-visible events" compact>
              <div className="space-y-2">
                {detail.data.recentAuditEvents.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    No recent activity found.
                  </p>
                ) : (
                  detail.data.recentAuditEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                        <p className="text-xs font-semibold text-foreground">{event.action.replaceAll("_", " ")}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{event.entityName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={detail.data?.user.status === "SUSPENDED" ? "Reactivate account?" : "Suspend account?"}
        message={
          detail.data?.user.status === "SUSPENDED"
            ? "This user will regain access to the platform."
            : "This user will be blocked from logging into the platform."
        }
        confirmLabel={detail.data?.user.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggle}
        loading={toggleStatusAction.loading}
        danger={detail.data?.user.status !== "SUSPENDED"}
      />
    </div>
  );
}
