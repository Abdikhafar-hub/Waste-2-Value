"use client";

import Link from "next/link";
import { ArrowLeft, Camera, Check, UserRoundCheck, X } from "lucide-react";
import { useState } from "react";
import { AssignProcessorDialog } from "@/components/org-admin/assign-processor-dialog";
import { PipelineTimeline } from "@/components/org-admin/pipeline-timeline";
import { WasteTypeBadge } from "@/components/org-admin/waste-type-badge";
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
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type WasteStatus } from "@/types/org-admin";

export function WasteDetailView({ submissionId }: { submissionId: string }) {
  const [confirmMode, setConfirmMode] = useState<"APPROVE" | "REJECT" | "REVIEW" | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const submission = useAsyncResource(() => orgAdminService.getWasteSubmissionById(submissionId), [submissionId]);
  const filters = useAsyncResource(() => orgAdminService.listWasteFilters(), []);
  const statusAction = useAsyncAction((status: WasteStatus, note?: string) =>
    orgAdminService.setWasteStatus(submissionId, status, note),
  );
  const assignAction = useAsyncAction((processorId: string) =>
    orgAdminService.assignWasteProcessor(submissionId, processorId),
  );

  const handleStatusUpdate = async () => {
    if (!confirmMode) {
      return;
    }

    if (confirmMode === "APPROVE") {
      await statusAction.execute("APPROVED", "Approved from waste detail panel.");
    }

    if (confirmMode === "REJECT") {
      await statusAction.execute("REJECTED", "Rejected after detail review.");
    }

    if (confirmMode === "REVIEW") {
      await statusAction.execute("UNDER_REVIEW", "Moved under review.");
    }

    setConfirmMode(null);
    await submission.reload();
  };

  const handleAssign = async (processorId: string) => {
    await assignAction.execute(processorId);
    setAssignOpen(false);
    await submission.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Waste Submission Detail"
        description="Full lifecycle context, quality review, and assignment controls."
        actions={
          <>
            <Link href="/org-admin/waste">
              <Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setConfirmMode("REVIEW")}>Mark Under Review</Button>
            <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}><UserRoundCheck className="h-4 w-4" />Assign Processor</Button>
            <Button size="sm" onClick={() => setConfirmMode("APPROVE")}><Check className="h-4 w-4" />Approve</Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmMode("REJECT")}><X className="h-4 w-4" />Reject</Button>
          </>
        }
      />

      {submission.error ? <ErrorState message={submission.error} onRetry={() => void submission.reload()} /> : null}

      {submission.loading || !submission.data ? (
        <LoadingState rows={8} />
      ) : (
        <>
          <SectionCard title={submission.data.reference} subtitle={submission.data.notes ?? "No notes provided."}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Collector" value={submission.data.collectorName} />
              <StatBlock label="Weight" value={formatWeightKg(submission.data.weightKg)} />
              <StatBlock label="Zone" value={submission.data.zone} />
              <StatBlock label="Collection Point" value={submission.data.collectionPoint} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={submission.data.status} />
              <WasteTypeBadge type={submission.data.wasteType} />
              {submission.data.tagCode ? <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs">Tag: {submission.data.tagCode}</span> : null}
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">Submitted {formatDateTime(submission.data.submittedAt)}</span>
            </div>
          </SectionCard>

          <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
            <SectionCard title="Lifecycle Timeline" subtitle="Status journey for this submission" compact>
              <PipelineTimeline submission={submission.data} />
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Review Panel" subtitle="Operational decisions" compact>
                <div className="space-y-2">
                  <div className="rounded-lg border border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    Assigned processor: {submission.data.assignedProcessorName ?? "Not assigned"}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => setConfirmMode("REVIEW")}>Under Review</Button>
                    <Button variant="secondary" onClick={() => setAssignOpen(true)}>Assign</Button>
                    <Button onClick={() => setConfirmMode("APPROVE")}>Approve</Button>
                    <Button variant="danger" onClick={() => setConfirmMode("REJECT")}>Reject</Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Submission Media" subtitle="Image/evidence placeholder" compact>
                <div className="flex min-h-[170px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-soft text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4" />Media preview placeholder</span>
                </div>
              </SectionCard>
            </div>
          </section>

          <SectionCard title="Audit History" subtitle="Action log for this submission" compact>
            <div className="space-y-2">
              {submission.data.history.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">{entry.action.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.details}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.actor} • {formatDateTime(entry.at)}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmMode)}
        title={confirmMode === "APPROVE" ? "Approve submission?" : confirmMode === "REJECT" ? "Reject submission?" : "Mark under review?"}
        message={confirmMode === "APPROVE" ? "Submission will proceed to assignment/processing." : confirmMode === "REJECT" ? "Submission will be rejected with a review note." : "Submission will be flagged for deeper review."}
        confirmLabel={confirmMode === "APPROVE" ? "Approve" : confirmMode === "REJECT" ? "Reject" : "Mark Review"}
        onClose={() => setConfirmMode(null)}
        onConfirm={handleStatusUpdate}
        loading={statusAction.loading}
        danger={confirmMode === "REJECT"}
      />

      <AssignProcessorDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        processors={filters.data?.processors ?? []}
        onAssign={handleAssign}
        loading={assignAction.loading}
      />
    </div>
  );
}
