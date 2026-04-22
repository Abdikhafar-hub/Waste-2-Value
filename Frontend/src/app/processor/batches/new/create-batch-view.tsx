"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AssignmentStatusChip } from "@/components/processor/assignment-status-chip";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { processorService } from "@/lib/services/processor-service";
import { formatWeightKg } from "@/lib/utils";

export function CreateBatchView({ preselectedAssignmentId }: { preselectedAssignmentId?: string }) {
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
    preselectedAssignmentId ? [preselectedAssignmentId] : [],
  );
  const [processingCenter, setProcessingCenter] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; reference: string } | null>(null);

  const meta = useAsyncResource(() => processorService.getBatchCreationMeta(), []);
  const createBatch = useAsyncAction((payload: Parameters<typeof processorService.createBatch>[0]) =>
    processorService.createBatch(payload),
  );

  const selectedAssignments = useMemo(() => {
    const items = meta.data?.eligibleAssignments ?? [];
    return items.filter((item) => selectedAssignmentIds.includes(item.id));
  }, [meta.data?.eligibleAssignments, selectedAssignmentIds]);

  const totalInputWeight = useMemo(
    () => selectedAssignments.reduce((sum, item) => sum + item.weightKg, 0),
    [selectedAssignments],
  );

  const mixedTypesSelected = useMemo(() => {
    if (selectedAssignments.length <= 1) {
      return false;
    }

    return selectedAssignments.some((item) => item.wasteType !== selectedAssignments[0].wasteType);
  }, [selectedAssignments]);

  const toggleSelection = (assignmentId: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((item) => item !== assignmentId)
        : [...prev, assignmentId],
    );
  };

  const handleCreate = async () => {
    if (selectedAssignmentIds.length === 0) {
      setLocalError("Select at least one input assignment.");
      return;
    }

    if (!processingCenter.trim()) {
      setLocalError("Select a processing center.");
      return;
    }

    if (mixedTypesSelected) {
      setLocalError("Selected assignments must have the same waste type.");
      return;
    }

    setLocalError(null);

    try {
      const batch = await createBatch.execute({
        assignmentIds: selectedAssignmentIds,
        processingCenter,
        notes: notes.trim() || undefined,
      });

      setCreated({ id: batch.id, reference: batch.reference });
    } catch {
      // Error rendered through useAsyncAction state.
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Production Batch"
        description="Group eligible inputs, confirm center context, and initialize production tracking."
        actions={
          <Link href="/processor/batches">
            <Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />

      {meta.error ? <ErrorState message={meta.error} onRetry={() => void meta.reload()} /> : null}
      {createBatch.error ? <ErrorState message={createBatch.error} /> : null}

      {meta.loading || !meta.data ? (
        <LoadingState rows={8} />
      ) : created ? (
        <SectionCard title="Batch created" subtitle="Production record initialized successfully" compact>
          <div className="rounded-xl border border-[#bfe2cd] bg-[#ecf8f1] p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">{created.reference} is ready</p>
            <p className="mt-1 text-xs text-muted-foreground">Continue to batch detail for output recording and completion.</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/processor/batches/${created.id}`}>
                <Button size="sm">Open Batch</Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={() => setCreated(null)}>Create Another</Button>
            </div>
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Step 1: Select Inputs" subtitle="Choose one or more eligible assignments" compact>
            <div className="space-y-2">
              {meta.data.eligibleAssignments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                  No eligible assignments available for batch creation.
                </p>
              ) : (
                meta.data.eligibleAssignments.map((assignment) => {
                  const selected = selectedAssignmentIds.includes(assignment.id);

                  return (
                    <button
                      type="button"
                      key={assignment.id}
                      onClick={() => toggleSelection(assignment.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${selected ? "border-brand bg-brand-soft/40" : "border-border bg-white"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{assignment.reference}</p>
                          <p className="text-xs text-muted-foreground">{assignment.wasteType} • {formatWeightKg(assignment.weightKg)} • {assignment.processingCenter}</p>
                        </div>
                        <AssignmentStatusChip status={assignment.status} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </SectionCard>

          <SectionCard title="Step 2: Batch Context" subtitle="Center and notes" compact>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Processing Center</label>
                <Select value={processingCenter} onChange={(event) => setProcessingCenter(event.target.value)}>
                  <option value="">Select center</option>
                  {meta.data.processingCenters.map((center) => (
                    <option key={center} value={center}>{center}</option>
                  ))}
                </Select>
              </div>
              <div className="rounded-lg border border-border bg-surface-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected Inputs</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{selectedAssignmentIds.length}</p>
                <p className="text-xs text-muted-foreground">Total input {formatWeightKg(totalInputWeight)}</p>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes (optional)</label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Batch preparation notes" />
            </div>

            {localError ? <p className="mt-2 text-sm text-danger">{localError}</p> : null}

            <div className="mt-3">
              <Button onClick={() => void handleCreate()} loading={createBatch.loading} disabled={meta.data.eligibleAssignments.length === 0}>
                Create Batch
              </Button>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
