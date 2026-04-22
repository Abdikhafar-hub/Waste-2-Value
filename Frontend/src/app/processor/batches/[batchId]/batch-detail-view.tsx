"use client";

import Link from "next/link";
import { ArrowLeft, Boxes, ClipboardCheck, Factory, FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { BatchStatusChip } from "@/components/processor/batch-status-chip";
import { BatchTimeline } from "@/components/processor/batch-timeline";
import { InputTraceabilityList } from "@/components/processor/input-traceability-list";
import { OutputRecordingForm } from "@/components/processor/output-recording-form";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { processorService } from "@/lib/services/processor-service";
import { formatDate, formatDateTime, formatWeightKg } from "@/lib/utils";
import { type RecordProcessorOutputInput } from "@/types/processor";

export function BatchDetailView({ batchId }: { batchId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [completePromptOpen, setCompletePromptOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const detail = useAsyncResource(async () => {
    const batch = await processorService.getBatchById(batchId);
    const inputs = await processorService.getAssignmentsByIds(batch.assignmentIds);
    return { batch, inputs };
  }, [batchId, refreshKey]);

  const recordOutputAction = useAsyncAction((payload: RecordProcessorOutputInput) =>
    processorService.recordBatchOutput(batchId, payload),
  );
  const completeBatchAction = useAsyncAction(() => processorService.completeBatch(batchId));

  const outputTotals = useMemo(() => {
    if (!detail.data) {
      return { entries: 0, quantity: 0 };
    }

    return {
      entries: detail.data.batch.outputs.length,
      quantity: detail.data.batch.outputs.reduce((sum, output) => sum + output.quantity, 0),
    };
  }, [detail.data]);

  const handleRecordOutput = async (payload: RecordProcessorOutputInput) => {
    setSuccessMessage(null);

    try {
      await recordOutputAction.execute(payload);
      setSuccessMessage("Output recorded successfully.");
      setRefreshKey((prev) => prev + 1);
    } catch {
      // Error is exposed through useAsyncAction state and rendered below.
    }
  };

  const handleCompleteBatch = async () => {
    setSuccessMessage(null);

    try {
      const completed = await completeBatchAction.execute();
      setSuccessMessage(`${completed.reference} completed. Waste has now been converted into tracked value.`);
      setCompletePromptOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch {
      // Error is exposed through useAsyncAction state and rendered below.
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Batch Detail"
        description="Track input traceability, production outputs, and closeout status for one batch."
        actions={
          <>
            <Link href="/processor/batches">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Link href="/processor/assignments">
              <Button variant="secondary" size="sm">
                <ClipboardCheck className="h-4 w-4" />
                View Assignments
              </Button>
            </Link>
          </>
        }
      />

      {detail.error ? <ErrorState message={detail.error} onRetry={() => void detail.reload()} /> : null}
      {recordOutputAction.error ? <ErrorState message={recordOutputAction.error} /> : null}
      {completeBatchAction.error ? <ErrorState message={completeBatchAction.error} /> : null}

      {successMessage ? (
        <div className="rounded-xl border border-[#c9e5d5] bg-[#eaf7f0] px-4 py-3 text-sm text-[#11643c]">
          {successMessage}
        </div>
      ) : null}

      {detail.loading || !detail.data ? (
        <LoadingState rows={8} />
      ) : (
        <>
          <SectionCard
            title={detail.data.batch.reference}
            subtitle={detail.data.batch.notes ?? "No batch notes recorded."}
            actions={<BatchStatusChip status={detail.data.batch.status} />}
            compact
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatBlock label="Waste Type" value={detail.data.batch.wasteType} />
              <StatBlock label="Input Weight" value={formatWeightKg(detail.data.batch.inputWeightKg)} />
              <StatBlock label="Processing Center" value={detail.data.batch.processingCenter} />
              <StatBlock label="Processor" value={detail.data.batch.processorName} />
              <StatBlock label="Started" value={formatDateTime(detail.data.batch.startedAt)} />
              <StatBlock label="Completed" value={detail.data.batch.completedAt ? formatDateTime(detail.data.batch.completedAt) : "Not completed"} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input References</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{detail.data.batch.inputReferences.length}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output Entries</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{outputTotals.entries}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Output Qty</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{outputTotals.quantity}</p>
              </div>
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <SectionCard
              title="Input Traceability"
              subtitle="Assignments linked into this production batch"
              compact
            >
              {detail.data.inputs.length === 0 ? (
                <EmptyState
                  icon={Boxes}
                  title="No traceability inputs"
                  message="This batch currently has no linked assignments."
                />
              ) : (
                <InputTraceabilityList inputs={detail.data.inputs} />
              )}
            </SectionCard>

            <div className="space-y-4">
              <SectionCard
                title="Record Outputs"
                subtitle="Capture quantities produced from this batch"
                compact
              >
                {detail.data.batch.status === "COMPLETED" ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    This batch is completed. Output recording is locked.
                  </p>
                ) : (
                  <OutputRecordingForm
                    onSubmit={handleRecordOutput}
                    loading={recordOutputAction.loading}
                  />
                )}
              </SectionCard>

              <SectionCard title="Batch Controls" subtitle="Safe workflow closeout actions" compact>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Complete this batch after all output records are captured and verified.
                  </p>
                  <Button
                    className="w-full justify-center"
                    disabled={detail.data.batch.status === "COMPLETED" || detail.data.batch.outputs.length === 0}
                    onClick={() => setCompletePromptOpen(true)}
                  >
                    <Factory className="h-4 w-4" />
                    Complete Batch
                  </Button>
                  {detail.data.batch.outputs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Record at least one output before completion.</p>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          </section>

          <SectionCard title="Output Records" subtitle="Structured production outputs from this batch" compact>
            {detail.data.batch.outputs.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="No outputs recorded"
                message="Use the output form to log production results for this batch."
              />
            ) : (
              <div className="space-y-2">
                {detail.data.batch.outputs.map((output) => (
                  <div key={output.id} className="rounded-lg border border-border bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{output.outputType.replaceAll("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(output.recordedAt)}</p>
                      </div>
                      <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs font-semibold text-foreground">
                        {output.quantity} {output.unit}
                      </span>
                    </div>
                    {output.notes ? <p className="mt-2 text-xs text-muted-foreground">{output.notes}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <SectionCard title="Workflow Timeline" subtitle="Step-by-step lifecycle for this batch" compact>
              <BatchTimeline items={detail.data.batch.timeline} />
            </SectionCard>

            <SectionCard title="Production History" subtitle="Audit-style activity for this batch" compact>
              <div className="space-y-2">
                {detail.data.batch.history.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold text-foreground">{item.action.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.details}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.actor} • {formatDate(item.at)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>
        </>
      )}

      <ConfirmDialog
        open={completePromptOpen}
        title="Complete this batch?"
        message="This will close the batch, mark linked inputs as processed, and post credit earnings."
        confirmLabel="Complete Batch"
        onClose={() => setCompletePromptOpen(false)}
        onConfirm={handleCompleteBatch}
        loading={completeBatchAction.loading}
      />
    </div>
  );
}
