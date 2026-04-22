"use client";

import Link from "next/link";
import { ArrowLeft, CheckCheck, FlaskConical, PackageCheck } from "lucide-react";
import { useState } from "react";
import { AssignmentStatusChip } from "@/components/processor/assignment-status-chip";
import { BatchTimeline } from "@/components/processor/batch-timeline";
import { OperationalActionPanel } from "@/components/processor/operational-action-panel";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { processorService } from "@/lib/services/processor-service";
import { formatDateTime, formatWeightKg } from "@/lib/utils";

export function AssignmentDetailView({ submissionId }: { submissionId: string }) {
  const [actionMode, setActionMode] = useState<"RECEIPT" | "START" | "PROCESSED" | null>(null);

  const assignment = useAsyncResource(() => processorService.getAssignmentById(submissionId), [submissionId]);

  const receiptAction = useAsyncAction(() => processorService.confirmReceipt(submissionId));
  const startAction = useAsyncAction(() => processorService.startProcessing(submissionId));
  const processedAction = useAsyncAction(() => processorService.markAssignmentProcessed(submissionId));

  const isLoading = receiptAction.loading || startAction.loading || processedAction.loading;

  const handleAction = async () => {
    if (actionMode === "RECEIPT") {
      await receiptAction.execute();
    }

    if (actionMode === "START") {
      await startAction.execute();
    }

    if (actionMode === "PROCESSED") {
      await processedAction.execute();
    }

    setActionMode(null);
    await assignment.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assignment Detail"
        description="Traceability view for a single assigned input with clear workflow actions."
        actions={
          <>
            <Link href="/processor/assignments">
              <Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button>
            </Link>
            <Link href={`/processor/batches/new?assignmentId=${submissionId}`}>
              <Button size="sm" variant="secondary"><FlaskConical className="h-4 w-4" />Create Batch</Button>
            </Link>
          </>
        }
      />

      {assignment.error ? <ErrorState message={assignment.error} onRetry={() => void assignment.reload()} /> : null}

      {assignment.loading || !assignment.data ? (
        <LoadingState rows={8} />
      ) : (
        <>
          <SectionCard title={assignment.data.reference} subtitle={assignment.data.notes ?? "No notes provided."} compact>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Collector" value={assignment.data.collectorName} />
              <StatBlock label="Waste Type" value={assignment.data.wasteType} />
              <StatBlock label="Weight" value={formatWeightKg(assignment.data.weightKg)} />
              <StatBlock label="Assigned" value={formatDateTime(assignment.data.assignedAt)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AssignmentStatusChip status={assignment.data.status} />
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                Zone: {assignment.data.zone}
              </span>
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                Center: {assignment.data.processingCenter}
              </span>
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <SectionCard title="Lifecycle Timeline" subtitle="Status progression and operational timestamps" compact>
              <BatchTimeline items={assignment.data.timeline} />
            </SectionCard>

            <div className="space-y-4">
              <OperationalActionPanel
                title="Operational Actions"
                description="Take the next workflow step based on current status."
                actions={
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={assignment.data.status !== "AWAITING_RECEIPT"}
                      onClick={() => setActionMode("RECEIPT")}
                    >
                      <PackageCheck className="h-4 w-4" />
                      Confirm Receipt
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={assignment.data.status !== "RECEIVED"}
                      onClick={() => setActionMode("START")}
                    >
                      <FlaskConical className="h-4 w-4" />
                      Start Processing
                    </Button>
                    <Button
                      size="sm"
                      disabled={assignment.data.status !== "IN_PROCESSING"}
                      onClick={() => setActionMode("PROCESSED")}
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark Processed
                    </Button>
                  </>
                }
              />

              <SectionCard title="Readiness" subtitle="Processing context" compact>
                <div className="space-y-2 text-sm text-foreground">
                  <p><span className="font-semibold">Collection Point:</span> {assignment.data.collectionPoint ?? "Not provided"}</p>
                  <p><span className="font-semibold">Tag Code:</span> {assignment.data.tagCode ?? "Not provided"}</p>
                  <p><span className="font-semibold">Assigned Processor:</span> {assignment.data.processorName}</p>
                </div>
              </SectionCard>
            </div>
          </section>

          <SectionCard title="Activity History" subtitle="Audit-style operational events" compact>
            <div className="space-y-2">
              {assignment.data.history.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">{item.action.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.details}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.actor} • {formatDateTime(item.at)}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      <ConfirmDialog
        open={Boolean(actionMode)}
        title={
          actionMode === "RECEIPT"
            ? "Confirm receipt?"
            : actionMode === "START"
              ? "Start processing?"
              : "Mark as processed?"
        }
        message={
          actionMode === "RECEIPT"
            ? "This confirms the input was received and checked."
            : actionMode === "START"
              ? "This assignment moves into active processing workflow."
              : "This assignment will be marked processed."
        }
        confirmLabel={
          actionMode === "RECEIPT"
            ? "Confirm"
            : actionMode === "START"
              ? "Start"
              : "Mark Processed"
        }
        onClose={() => setActionMode(null)}
        onConfirm={handleAction}
        loading={isLoading}
      />
    </div>
  );
}
