"use client";

import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { CreateOrgAdminDialog } from "@/components/platform/create-org-admin-dialog";
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
import { type CreateOrganizationAdminInput } from "@/types/platform";

export function OrganizationDetailView({ organizationId }: { organizationId: string }) {
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  const detail = useAsyncResource(() => platformService.getOrganizationById(organizationId), [organizationId]);
  const createOrgAdminAction = useAsyncAction((payload: CreateOrganizationAdminInput) =>
    platformService.createOrganizationAdmin(organizationId, payload),
  );
  const toggleStatusAction = useAsyncAction(() => platformService.toggleOrganizationStatus(organizationId));

  const handleCreateAdmin = async (payload: Parameters<typeof platformService.createOrganizationAdmin>[1]) => {
    await createOrgAdminAction.execute(payload);
    setCreateAdminOpen(false);
    await detail.reload();
  };

  const handleToggleStatus = async () => {
    await toggleStatusAction.execute();
    setConfirmToggleOpen(false);
    await detail.reload();
  };

  return (
    <div>
      <PageHeader
        title="Organization Detail"
        description="Platform-level oversight for tenant readiness, account ownership, and access posture."
        actions={
          <>
            <Link href="/organizations">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCreateAdminOpen(true)}
              disabled={detail.data?.organization.hasOrgAdmin}
            >
              <UserPlus className="h-4 w-4" />
              {detail.data?.organization.hasOrgAdmin ? "Org Admin Exists" : "Create Org Admin"}
            </Button>
            <Button
              variant={detail.data?.organization.status === "SUSPENDED" ? "secondary" : "danger"}
              size="sm"
              onClick={() => setConfirmToggleOpen(true)}
            >
              {detail.data?.organization.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
            </Button>
          </>
        }
      />

      {detail.error ? <ErrorState message={detail.error} onRetry={() => void detail.reload()} /> : null}

      {detail.loading || !detail.data ? (
        <LoadingState rows={7} />
      ) : (
        <div className="space-y-4">
          <SectionCard title={detail.data.organization.name} subtitle={detail.data.organization.description}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Status" value={detail.data.organization.status.replaceAll("_", " ")} />
              <StatBlock label="Slug" value={detail.data.organization.slug} />
              <StatBlock label="Created" value={formatDate(detail.data.organization.createdAt)} />
              <StatBlock label="Users" value={String(detail.data.organization.userCount)} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={detail.data.organization.status} />
              <StatusBadge status={detail.data.organization.onboardingStage} />
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Tenant Health" subtitle="Platform readiness and policy context" compact>
              <div className="grid gap-2">
                <StatBlock
                  label="Readiness Score"
                  value={`${detail.data.organization.readinessScore}%`}
                  helper="Derived from setup completion and policy checks"
                />
                <StatBlock label="Readiness Tier" value={detail.data.metadata.readinessTier} />
                <StatBlock label="Tenant Key" value={detail.data.metadata.tenantKey} />
                <StatBlock label="Policy Review" value={formatDate(detail.data.metadata.lastPolicyReview)} />
              </div>
            </SectionCard>

            <SectionCard title="Org Admins" subtitle="Primary tenant administrators" compact>
              <div className="space-y-2">
                {detail.data.orgAdmins.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    No org admin assigned yet.
                  </p>
                ) : (
                  detail.data.orgAdmins.map((user) => (
                    <div key={user.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={user.status} />
                        <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Recent Users" subtitle="Latest users inside this organization" compact>
              <div className="space-y-2">
                {detail.data.recentUsers.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    No users available for this organization.
                  </p>
                ) : (
                  detail.data.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
                      </div>
                      <StatusBadge status={user.status} />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Recent Platform Activity" subtitle="Organization-level audit visibility" compact>
              <div className="space-y-2">
                {detail.data.recentAuditEvents.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    No recent audit activity.
                  </p>
                ) : (
                  detail.data.recentAuditEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-border p-3">
                      <p className="text-xs font-semibold text-foreground">{event.action.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{event.actorName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </section>
        </div>
      )}

      {createAdminOpen ? (
        <CreateOrgAdminDialog
          open={createAdminOpen}
          organization={detail.data?.organization}
          onClose={() => setCreateAdminOpen(false)}
          onCreate={handleCreateAdmin}
          loading={createOrgAdminAction.loading}
        />
      ) : null}

      <ConfirmDialog
        open={confirmToggleOpen}
        title={detail.data?.organization.status === "SUSPENDED" ? "Reactivate tenant?" : "Suspend tenant?"}
        message={
          detail.data?.organization.status === "SUSPENDED"
            ? "This tenant will regain access for all active users."
            : "This tenant and related user sessions will be disabled from platform access."
        }
        confirmLabel={detail.data?.organization.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
        onConfirm={handleToggleStatus}
        onClose={() => setConfirmToggleOpen(false)}
        loading={toggleStatusAction.loading}
        danger={detail.data?.organization.status !== "SUSPENDED"}
      />
    </div>
  );
}
