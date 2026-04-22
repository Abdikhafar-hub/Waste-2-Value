"use client";

import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { useState } from "react";
import { AssignProcessorDialog } from "@/components/org-admin/assign-processor-dialog";
import { WasteTypeBadge } from "@/components/org-admin/waste-type-badge";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type WasteQuery, type WasteStatus, type WasteSubmission } from "@/types/org-admin";

export default function WastePage() {
  const [query, setQuery] = useState<WasteQuery>({
    search: "",
    status: "ALL",
    wasteType: "ALL",
    zone: "ALL",
    collectorId: "ALL",
    processorId: "ALL",
  });

  const [selected, setSelected] = useState<WasteSubmission | undefined>();
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | "REVIEW" | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const wasteFilters = useAsyncResource(() => orgAdminService.listWasteFilters(), []);
  const waste = useAsyncResource(
    () => orgAdminService.getWasteSubmissions(query),
    [query.search, query.status, query.wasteType, query.zone, query.collectorId, query.processorId],
  );

  const setStatusAction = useAsyncAction((submissionId: string, status: WasteStatus, note?: string) =>
    orgAdminService.setWasteStatus(submissionId, status, note),
  );
  const assignAction = useAsyncAction((submissionId: string, processorId: string) =>
    orgAdminService.assignWasteProcessor(submissionId, processorId),
  );

  const openStatusDialog = (submission: WasteSubmission, mode: "APPROVE" | "REJECT" | "REVIEW") => {
    setSelected(submission);
    setDecision(mode);
  };

  const handleStatusAction = async () => {
    if (!selected || !decision) {
      return;
    }

    if (decision === "APPROVE") {
      await setStatusAction.execute(selected.id, "APPROVED", "Approved by org admin.");
    }

    if (decision === "REJECT") {
      await setStatusAction.execute(selected.id, "REJECTED", "Rejected due to quality or contamination issues.");
    }

    if (decision === "REVIEW") {
      await setStatusAction.execute(selected.id, "UNDER_REVIEW", "Moved under review by org admin.");
    }

    setSelected(undefined);
    setDecision(null);
    await waste.reload();
  };

  const handleAssign = async (processorId: string) => {
    if (!selected) {
      return;
    }

    await assignAction.execute(selected.id, processorId);
    setAssignOpen(false);
    setSelected(undefined);
    await waste.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Waste Operations"
        description="Fast, review-first control over incoming waste submissions and processor assignment."
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search by reference, collector, or collection point"
        filters={
          <>
            <Select
              value={query.status ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, status: event.target.value as WasteQuery["status"] }))}
              className="w-[170px]"
            >
              <option value="ALL">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROCESSING">In Processing</option>
              <option value="PROCESSED">Processed</option>
            </Select>

            <Select
              value={query.wasteType ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, wasteType: event.target.value as WasteQuery["wasteType"] }))}
              className="w-[150px]"
            >
              <option value="ALL">All Types</option>
              <option value="ORGANIC">Organic</option>
              <option value="PLASTIC">Plastic</option>
              <option value="PAPER">Paper</option>
              <option value="METAL">Metal</option>
              <option value="GLASS">Glass</option>
            </Select>

            <Select
              value={query.zone ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, zone: event.target.value }))}
              className="w-[150px]"
            >
              <option value="ALL">All Zones</option>
              {(wasteFilters.data?.zones ?? []).map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </Select>

            <Select
              value={query.collectorId ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, collectorId: event.target.value }))}
              className="w-[170px]"
            >
              <option value="ALL">All Collectors</option>
              {(wasteFilters.data?.collectors ?? []).map((collector) => (
                <option key={collector.id} value={collector.id}>{collector.label}</option>
              ))}
            </Select>

            <Select
              value={query.processorId ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, processorId: event.target.value }))}
              className="w-[170px]"
            >
              <option value="ALL">All Processors</option>
              {(wasteFilters.data?.processors ?? []).map((processor) => (
                <option key={processor.id} value={processor.id}>{processor.label}</option>
              ))}
            </Select>
          </>
        }
      />

      {waste.error ? <ErrorState message={waste.error} onRetry={() => void waste.reload()} /> : null}

      {waste.loading || !waste.data ? (
        <LoadingState rows={8} />
      ) : waste.data.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No submissions found" message="Try widening your filters or review latest intake activity." />
      ) : (
        <DataTable
          headers={[
            "Reference",
            "Collector",
            "Type",
            "Weight",
            "Zone",
            "Submitted",
            "Processor",
            "Status",
            "Actions",
          ]}
        >
          {waste.data.map((submission) => (
            <tr key={submission.id} className="hover:bg-surface-soft/60">
              <td className="px-4 py-3 text-sm font-semibold text-foreground">{submission.reference}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{submission.collectorName}</td>
              <td className="px-4 py-3"><WasteTypeBadge type={submission.wasteType} /></td>
              <td className="px-4 py-3 text-sm text-foreground">{formatWeightKg(submission.weightKg)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{submission.zone}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(submission.submittedAt)}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{submission.assignedProcessorName ?? "Not assigned"}</td>
              <td className="px-4 py-3"><StatusBadge status={submission.status} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/org-admin/waste/${submission.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => openStatusDialog(submission, "APPROVE")}>Approve</Button>
                  <Button variant="secondary" size="sm" onClick={() => openStatusDialog(submission, "REVIEW")}>Review</Button>
                  <Button variant="danger" size="sm" onClick={() => openStatusDialog(submission, "REJECT")}>Reject</Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelected(submission);
                      setAssignOpen(true);
                    }}
                  >
                    Assign
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <ConfirmDialog
        open={Boolean(selected && decision)}
        title={decision === "APPROVE" ? "Approve submission?" : decision === "REJECT" ? "Reject submission?" : "Mark under review?"}
        message={decision === "APPROVE" ? "This submission will move to approved status." : decision === "REJECT" ? "This submission will be rejected and returned with reason." : "This submission will be marked under review."}
        confirmLabel={decision === "APPROVE" ? "Approve" : decision === "REJECT" ? "Reject" : "Mark Review"}
        onConfirm={handleStatusAction}
        onClose={() => {
          setSelected(undefined);
          setDecision(null);
        }}
        loading={setStatusAction.loading}
        danger={decision === "REJECT"}
      />

      <AssignProcessorDialog
        open={assignOpen}
        onClose={() => {
          setAssignOpen(false);
          setSelected(undefined);
        }}
        processors={wasteFilters.data?.processors ?? []}
        onAssign={handleAssign}
        loading={assignAction.loading}
      />
    </div>
  );
}
