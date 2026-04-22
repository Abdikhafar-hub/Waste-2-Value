"use client";

import Link from "next/link";
import { ListFilter } from "lucide-react";
import { useState } from "react";
import { AssignmentStatusChip } from "@/components/processor/assignment-status-chip";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { processorService } from "@/lib/services/processor-service";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type ProcessorAssignment, type ProcessorAssignmentQuery } from "@/types/processor";

export default function ProcessorAssignmentsPage() {
  const [query, setQuery] = useState<ProcessorAssignmentQuery>({
    search: "",
    status: "ALL",
    wasteType: "ALL",
    zone: "ALL",
    processingCenter: "ALL",
  });

  const [selected, setSelected] = useState<ProcessorAssignment | undefined>();
  const [selectedAction, setSelectedAction] = useState<"RECEIPT" | "START" | "PROCESSED" | null>(null);

  const filters = useAsyncResource(() => processorService.getFilterMeta(), []);
  const assignments = useAsyncResource(
    () => processorService.getAssignments(query),
    [query.search, query.status, query.wasteType, query.zone, query.processingCenter],
  );

  const confirmReceiptAction = useAsyncAction((submissionId: string) => processorService.confirmReceipt(submissionId));
  const startProcessingAction = useAsyncAction((submissionId: string) => processorService.startProcessing(submissionId));
  const markProcessedAction = useAsyncAction((submissionId: string) => processorService.markAssignmentProcessed(submissionId));

  const handleWorkflowAction = async () => {
    if (!selected || !selectedAction) {
      return;
    }

    if (selectedAction === "RECEIPT") {
      await confirmReceiptAction.execute(selected.id);
    }

    if (selectedAction === "START") {
      await startProcessingAction.execute(selected.id);
    }

    if (selectedAction === "PROCESSED") {
      await markProcessedAction.execute(selected.id);
    }

    setSelected(undefined);
    setSelectedAction(null);
    await assignments.reload();
  };

  const isActionLoading =
    confirmReceiptAction.loading || startProcessingAction.loading || markProcessedAction.loading;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assignments"
        description="Manage assigned waste inputs from receipt confirmation through processing completion."
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search by reference, collector, or collection point"
        filters={
          <>
            <Select
              value={query.status ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, status: event.target.value as ProcessorAssignmentQuery["status"] }))}
              className="w-[180px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="AWAITING_RECEIPT">Awaiting Receipt</option>
              <option value="RECEIVED">Received</option>
              <option value="IN_PROCESSING">In Processing</option>
              <option value="PROCESSED">Processed</option>
            </Select>

            <Select
              value={query.wasteType ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, wasteType: event.target.value as ProcessorAssignmentQuery["wasteType"] }))}
              className="w-[150px]"
            >
              <option value="ALL">All Types</option>
              <option value="ORGANIC">Organic</option>
              <option value="PLASTIC">Plastic</option>
            </Select>

            <Select
              value={query.zone ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, zone: event.target.value }))}
              className="w-[140px]"
            >
              <option value="ALL">All Zones</option>
              {(filters.data?.zones ?? []).map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </Select>

            <Select
              value={query.processingCenter ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, processingCenter: event.target.value }))}
              className="w-[190px]"
            >
              <option value="ALL">All Centers</option>
              {(filters.data?.processingCenters ?? []).map((center) => (
                <option key={center} value={center}>{center}</option>
              ))}
            </Select>
          </>
        }
      />

      {assignments.error ? <ErrorState message={assignments.error} onRetry={() => void assignments.reload()} /> : null}

      {assignments.loading || !assignments.data ? (
        <LoadingState rows={8} />
      ) : assignments.data.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title="No assignments found"
          message="Adjust filters or wait for new assignments from operations."
        />
      ) : (
        <DataTable
          headers={[
            "Reference",
            "Collector",
            "Type",
            "Weight",
            "Zone",
            "Assigned",
            "Status",
            "Actions",
          ]}
        >
          {assignments.data.map((assignment) => (
            <tr key={assignment.id} className="hover:bg-surface-soft/60">
              <td className="px-4 py-3 text-sm font-semibold text-foreground">{assignment.reference}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{assignment.collectorName}</td>
              <td className="px-4 py-3 text-sm text-foreground">{assignment.wasteType}</td>
              <td className="px-4 py-3 text-sm text-foreground">{formatWeightKg(assignment.weightKg)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{assignment.zone}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(assignment.assignedAt)}</td>
              <td className="px-4 py-3"><AssignmentStatusChip status={assignment.status} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/processor/assignments/${assignment.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={assignment.status !== "AWAITING_RECEIPT"}
                    onClick={() => {
                      setSelected(assignment);
                      setSelectedAction("RECEIPT");
                    }}
                  >
                    Confirm Receipt
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={assignment.status !== "RECEIVED"}
                    onClick={() => {
                      setSelected(assignment);
                      setSelectedAction("START");
                    }}
                  >
                    Start
                  </Button>

                  <Button
                    size="sm"
                    disabled={assignment.status !== "IN_PROCESSING"}
                    onClick={() => {
                      setSelected(assignment);
                      setSelectedAction("PROCESSED");
                    }}
                  >
                    Mark Processed
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <ConfirmDialog
        open={Boolean(selected && selectedAction)}
        title={
          selectedAction === "RECEIPT"
            ? "Confirm receipt?"
            : selectedAction === "START"
              ? "Start processing?"
              : "Mark as processed?"
        }
        message={
          selectedAction === "RECEIPT"
            ? "This confirms you have received and checked the assignment input."
            : selectedAction === "START"
              ? "This assignment will move into active processing state."
              : "This assignment will be marked processed and ready for batch/output reconciliation."
        }
        confirmLabel={
          selectedAction === "RECEIPT"
            ? "Confirm"
            : selectedAction === "START"
              ? "Start"
              : "Mark Processed"
        }
        onClose={() => {
          setSelected(undefined);
          setSelectedAction(null);
        }}
        onConfirm={handleWorkflowAction}
        loading={isActionLoading}
      />
    </div>
  );
}
