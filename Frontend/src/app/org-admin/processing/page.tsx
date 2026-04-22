"use client";

import { Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/org-admin/segmented-control";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { StatusBadge } from "@/components/platform/status-badge";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type ProcessingBatch } from "@/types/org-admin";

export default function ProcessingPage() {
  const [tab, setTab] = useState<"ALL" | "QUEUED" | "ACTIVE" | "COMPLETED">("ALL");

  const data = useAsyncResource(async () => {
    const [batches, team] = await Promise.all([
      orgAdminService.getProcessingBatches(),
      orgAdminService.getTeamUsers({ role: "PROCESSOR", status: "ALL" }),
    ]);

    return { batches, team };
  }, []);

  const filteredBatches = useMemo(() => {
    if (!data.data) {
      return [];
    }

    if (tab === "ALL") {
      return data.data.batches;
    }

    return data.data.batches.filter((batch) => batch.status === tab);
  }, [data.data, tab]);

  const activeCount = data.data?.batches.filter((batch) => batch.status === "ACTIVE").length ?? 0;
  const queuedCount = data.data?.batches.filter((batch) => batch.status === "QUEUED").length ?? 0;
  const completedCount = data.data?.batches.filter((batch) => batch.status === "COMPLETED").length ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Processing Oversight"
        description="Queue visibility, active line performance, and completed batch output monitoring."
      />

      {data.error ? <ErrorState message={data.error} onRetry={() => void data.reload()} /> : null}

      {data.loading || !data.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <StatBlock label="Queued" value={String(queuedCount)} helper="Awaiting receipt" />
            <StatBlock label="Active" value={String(activeCount)} helper="Currently processing" />
            <StatBlock label="Completed" value={String(completedCount)} helper="Closed batches" />
          </section>

          <SectionCard
            title="Processing Queue"
            subtitle="Organized by stage for rapid operational review"
            actions={
              <SegmentedControl
                value={tab}
                onChange={setTab}
                options={[
                  { label: "All", value: "ALL" },
                  { label: "Queued", value: "QUEUED" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Completed", value: "COMPLETED" },
                ]}
              />
            }
            compact
          >
            {filteredBatches.length === 0 ? (
              <EmptyState icon={Activity} title="No batches in this stage" message="No processing batches match the selected filter." />
            ) : (
              <DataTable headers={["Batch", "Processor", "Waste Type", "Input", "Output", "Status", "Started"]}>
                {filteredBatches.map((batch: ProcessingBatch) => (
                  <tr key={batch.id} className="hover:bg-surface-soft/60">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{batch.reference}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{batch.processorName}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{batch.wasteType}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{formatWeightKg(batch.inputKg)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{batch.outputKg > 0 ? formatWeightKg(batch.outputKg) : "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={batch.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(batch.startedAt)}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </SectionCard>

          <SectionCard title="Processor Performance Snapshot" subtitle="Current team outputs" compact>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.team.map((processor) => (
                <div key={processor.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">{processor.firstName} {processor.lastName}</p>
                  <p className="text-xs text-muted-foreground">{processor.assignment ?? "No assignment"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-surface-soft p-2">
                      <p className="text-[11px] text-muted-foreground">Batches</p>
                      <p className="text-sm font-semibold text-foreground">{processor.stats.batchesCompleted ?? 0}</p>
                    </div>
                    <div className="rounded-md bg-surface-soft p-2">
                      <p className="text-[11px] text-muted-foreground">Output</p>
                      <p className="text-sm font-semibold text-foreground">{processor.stats.outputsProducedKg ?? 0} kg</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
