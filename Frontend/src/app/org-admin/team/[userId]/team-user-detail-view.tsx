"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useState } from "react";
import { RoleBadge } from "@/components/org-admin/role-badge";
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
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatDate, formatDateTime } from "@/lib/utils";

export function TeamUserDetailView({ userId }: { userId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const user = useAsyncResource(() => orgAdminService.getTeamUserById(userId), [userId]);
  const toggleStatusAction = useAsyncAction(() => orgAdminService.toggleTeamUserStatus(userId));

  const handleToggle = async () => {
    await toggleStatusAction.execute();
    setConfirmOpen(false);
    await user.reload();
  };

  const renderRoleStats = () => {
    if (!user.data) {
      return null;
    }

    if (user.data.role === "COLLECTOR") {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatBlock label="Submissions" value={String(user.data.stats.submissionsCount ?? 0)} />
          <StatBlock label="Approval Rate" value={`${user.data.stats.approvalRate ?? 0}%`} />
          <StatBlock label="Credits Earned" value={String(user.data.stats.creditsEarned ?? 0)} />
        </div>
      );
    }

    if (user.data.role === "PROCESSOR") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatBlock label="Batches Completed" value={String(user.data.stats.batchesCompleted ?? 0)} />
          <StatBlock label="Outputs Produced" value={`${user.data.stats.outputsProducedKg ?? 0} kg`} />
        </div>
      );
    }

    if (user.data.role === "BUYER") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatBlock label="Orders Placed" value={String(user.data.stats.ordersPlaced ?? 0)} />
          <StatBlock label="Total Purchased" value={`KES ${user.data.stats.totalPurchased ?? 0}`} />
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">No role-specific operational stats for this account.</p>;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team User Detail"
        description="Identity, role performance, and account controls for a single organization user."
        actions={
          <>
            <Link href="/org-admin/team">
              <Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button>
            </Link>
            <Button variant="secondary" size="sm"><KeyRound className="h-4 w-4" />Reset Temp Password</Button>
            <Button
              variant={user.data?.status === "SUSPENDED" ? "secondary" : "danger"}
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={user.data?.role === "ORG_ADMIN"}
            >
              {user.data?.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
            </Button>
          </>
        }
      />

      {user.error ? <ErrorState message={user.error} onRetry={() => void user.reload()} /> : null}

      {user.loading || !user.data ? (
        <LoadingState rows={6} />
      ) : (
        <>
          <SectionCard title={`${user.data.firstName} ${user.data.lastName}`} subtitle={user.data.email}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Role" value={user.data.role.replaceAll("_", " ")} />
              <StatBlock label="Status" value={user.data.status} />
              <StatBlock label="Joined" value={formatDate(user.data.joinedAt)} />
              <StatBlock label="Last Active" value={user.data.lastActiveAt ? formatDateTime(user.data.lastActiveAt) : "-"} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <RoleBadge role={user.data.role} />
              <StatusBadge status={user.data.status} />
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Contact & Assignment" subtitle="Operational context" compact>
              <div className="space-y-2 text-sm">
                <p className="text-foreground"><span className="font-semibold">Phone:</span> {user.data.phone ?? "Not provided"}</p>
                <p className="text-foreground"><span className="font-semibold">Zone:</span> {user.data.zone ?? "Not assigned"}</p>
                <p className="text-foreground"><span className="font-semibold">Assignment:</span> {user.data.assignment ?? "Pending"}</p>
              </div>
            </SectionCard>

            <SectionCard title="Role Performance" subtitle="Recent operational stats" compact>
              {renderRoleStats()}
            </SectionCard>
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={user.data?.status === "SUSPENDED" ? "Reactivate account?" : "Suspend account?"}
        message={user.data?.status === "SUSPENDED" ? "User access will be restored." : "User access will be blocked until reactivated."}
        confirmLabel={user.data?.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggle}
        loading={toggleStatusAction.loading}
        danger={user.data?.status !== "SUSPENDED"}
      />
    </div>
  );
}
