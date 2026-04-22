"use client";

import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { BatchCard } from "@/components/processor/batch-card";
import { BatchStatusChip } from "@/components/processor/batch-status-chip";
import { ProductionSummaryCard } from "@/components/processor/production-summary-card";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { processorService } from "@/lib/services/processor-service";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type ProcessorBatchQuery } from "@/types/processor";

export default function ProcessorBatchesPage() {
  const [query, setQuery] = useState<ProcessorBatchQuery>({ search: "", status: "ALL", wasteType: "ALL" });

  const batches = useAsyncResource(() => processorService.getBatches(query), [query.search, query.status, query.wasteType]);

  const summary = useMemo(() => {
    const list = batches.data ?? [];
    const totalOutputQuantity = list.reduce(
      (sum, batch) => sum + batch.outputs.reduce((inner, output) => inner + output.quantity, 0),
      0,
    );

    return {
      totalBatches: list.length,
      activeBatches: list.filter((item) => item.status === "ACTIVE").length,
      completedBatches: list.filter((item) => item.status === "COMPLETED").length,
      totalOutputQuantity,
    };
  }, [batches.data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Production Batches"
        description="Traceability view for batch creation, output recording, and closeout status."
        actions={
          <Link href="/processor/batches/new">
            <Button size="sm"><Plus className="h-4 w-4" />Create Batch</Button>
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProductionSummaryCard label="Total Batches" value={String(summary.totalBatches)} />
        <ProductionSummaryCard label="Active" value={String(summary.activeBatches)} />
        <ProductionSummaryCard label="Completed" value={String(summary.completedBatches)} />
        <ProductionSummaryCard label="Total Outputs" value={String(summary.totalOutputQuantity)} />
      </section>

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search by batch reference or center"
        filters={
          <>
            <Select
              value={query.status ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, status: event.target.value as ProcessorBatchQuery["status"] }))}
              className="w-[150px]"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </Select>

            <Select
              value={query.wasteType ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, wasteType: event.target.value as ProcessorBatchQuery["wasteType"] }))}
              className="w-[150px]"
            >
              <option value="ALL">All Types</option>
              <option value="ORGANIC">Organic</option>
              <option value="PLASTIC">Plastic</option>
            </Select>
          </>
        }
      />

      {batches.error ? <ErrorState message={batches.error} onRetry={() => void batches.reload()} /> : null}

      {batches.loading || !batches.data ? (
        <LoadingState rows={8} />
      ) : batches.data.length === 0 ? (
        <EmptyState icon={Layers} title="No batches found" message="Create a production batch to begin traceability records." />
      ) : (
        <>
          <div className="grid gap-2 md:hidden">
            {batches.data.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable headers={["Reference", "Type", "Input", "Outputs", "Status", "Started", "Completed", "Action"]}>
              {batches.data.map((batch) => (
                <tr key={batch.id} className="hover:bg-surface-soft/60">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{batch.reference}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{batch.wasteType}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{formatWeightKg(batch.inputWeightKg)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{batch.outputs.length}</td>
                  <td className="px-4 py-3"><BatchStatusChip status={batch.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(batch.startedAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{batch.completedAt ? formatDateTime(batch.completedAt) : "-"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/processor/batches/${batch.id}`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
