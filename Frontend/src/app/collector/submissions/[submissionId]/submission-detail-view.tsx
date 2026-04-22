"use client";

import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { HistoryTimeline } from "@/components/collector/history-timeline";
import { SubmissionStatusChip } from "@/components/collector/submission-status-chip";
import { WasteTypeBadge } from "@/components/org-admin/waste-type-badge";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { collectorService } from "@/lib/services/collector-service";
import { formatDateTime, formatWeightKg } from "@/lib/utils";

export function SubmissionDetailView({ submissionId }: { submissionId: string }) {
  const submission = useAsyncResource(() => collectorService.getSubmissionById(submissionId), [submissionId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Submission Detail"
        description="Track lifecycle updates and review feedback for this submission."
        actions={
          <Link href="/collector/submissions">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      {submission.error ? <ErrorState message={submission.error} onRetry={() => void submission.reload()} /> : null}

      {submission.loading || !submission.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <SectionCard title={submission.data.reference} subtitle={submission.data.notes ?? "No notes provided."} compact>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Waste Type" value={submission.data.wasteType} />
              <StatBlock label="Weight" value={formatWeightKg(submission.data.weightKg)} />
              <StatBlock label="Zone" value={submission.data.zone} />
              <StatBlock label="Submitted" value={formatDateTime(submission.data.submittedAt)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SubmissionStatusChip status={submission.data.status} />
              <WasteTypeBadge type={submission.data.wasteType} />
              {submission.data.collectionPoint ? (
                <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                  {submission.data.collectionPoint}
                </span>
              ) : null}
              {submission.data.tagCode ? (
                <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                  {submission.data.tagCode}
                </span>
              ) : null}
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <SectionCard title="Status Timeline" subtitle="Where your submission is in the process" compact>
              <HistoryTimeline items={submission.data.timeline} />
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Processing Visibility" subtitle="Operational updates" compact>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-semibold">Assigned Processor:</span>{" "}
                    {submission.data.assignedProcessorName ?? "Not assigned yet"}
                  </p>
                  <p className="text-foreground">
                    <span className="font-semibold">Current Status:</span> {submission.data.status.replaceAll("_", " ")}
                  </p>
                  {submission.data.reviewFeedback ? (
                    <div className="rounded-lg border border-[#f3d4b3] bg-[#fff8ee] p-2.5 text-xs text-[#8c521f]">
                      Feedback: {submission.data.reviewFeedback}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No review feedback available yet.</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Evidence" subtitle="Media and documentation" compact>
                <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-soft text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Image placeholder
                  </span>
                </div>
              </SectionCard>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
