"use client";

import Link from "next/link";
import { Factory, FilePlus2, PackageCheck, PlayCircle } from "lucide-react";
import { AssignmentStatusChip } from "@/components/processor/assignment-status-chip";
import { BatchCard } from "@/components/processor/batch-card";
import { ProductionSummaryCard } from "@/components/processor/production-summary-card";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { processorService } from "@/lib/services/processor-service";
import { formatCompactNumber, formatDateTime, formatWeightKg } from "@/lib/utils";

export default function ProcessorDashboardPage() {
  const dashboard = useAsyncResource(() => processorService.getDashboardData(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Processing Dashboard"
        description="Track assignments, active production, and output performance in one workflow view."
      />

      {dashboard.error ? <ErrorState message={dashboard.error} onRetry={() => void dashboard.reload()} /> : null}

      {dashboard.loading || !dashboard.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            <ProductionSummaryCard label="Assigned" value={String(dashboard.data.metrics.assignedCount)} />
            <ProductionSummaryCard label="Awaiting Receipt" value={String(dashboard.data.metrics.awaitingReceipt)} />
            <ProductionSummaryCard label="In Processing" value={String(dashboard.data.metrics.inProcessing)} />
            <ProductionSummaryCard label="Completed Batches" value={String(dashboard.data.metrics.completedBatches)} />
            <ProductionSummaryCard label="Outputs Produced" value={formatCompactNumber(dashboard.data.metrics.outputsProduced)} />
            <ProductionSummaryCard label="Credits Earned" value={String(dashboard.data.metrics.creditsEarned)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <SectionCard title="Recent Assignments" subtitle="Newest workload needing action" compact>
              {dashboard.data.recentAssignments.length === 0 ? (
                <EmptyState icon={Factory} title="No assignments yet" message="New assignments will appear once operations route inputs to you." />
              ) : (
                <DataTable headers={["Reference", "Collector", "Type", "Weight", "Status", "Action"]}>
                  {dashboard.data.recentAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{assignment.reference}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{assignment.collectorName}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{assignment.wasteType}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{formatWeightKg(assignment.weightKg)}</td>
                      <td className="px-4 py-3"><AssignmentStatusChip status={assignment.status} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/processor/assignments/${assignment.id}`}>
                          <Button size="sm" variant="secondary">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Quick Actions" subtitle="Most used processing actions" compact>
                <div className="grid gap-2">
                  <Link href="/processor/assignments">
                    <Button variant="secondary" className="w-full justify-start"><PackageCheck className="h-4 w-4" />Confirm receipt</Button>
                  </Link>
                  <Link href="/processor/assignments">
                    <Button variant="secondary" className="w-full justify-start"><PlayCircle className="h-4 w-4" />Start processing</Button>
                  </Link>
                  <Link href="/processor/batches/new">
                    <Button className="w-full justify-start"><FilePlus2 className="h-4 w-4" />Create batch</Button>
                  </Link>
                </div>
              </SectionCard>

              <SectionCard title="Active Batches" subtitle="In-flight production records" compact>
                {dashboard.data.activeBatches.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    No active batches.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboard.data.activeBatches.map((batch) => (
                      <BatchCard key={batch.id} batch={batch} />
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </section>

          <SectionCard title="Production Summary" subtitle="Today’s conversion status" compact>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open Workload</p>
                <p className="mt-1 text-sm text-foreground">{dashboard.data.metrics.awaitingReceipt + dashboard.data.metrics.inProcessing} items need immediate action.</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch Throughput</p>
                <p className="mt-1 text-sm text-foreground">{dashboard.data.metrics.completedBatches} completed batches in current cycle.</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Activity</p>
                <p className="mt-1 text-sm text-foreground">{dashboard.data.recentAssignments[0] ? formatDateTime(dashboard.data.recentAssignments[0].assignedAt) : "No activity"}</p>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
