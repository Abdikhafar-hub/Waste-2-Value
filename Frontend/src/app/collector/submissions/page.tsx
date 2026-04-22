"use client";

import Link from "next/link";
import { ListFilter, Plus } from "lucide-react";
import { useState } from "react";
import { SubmissionCard } from "@/components/collector/submission-card";
import { SubmissionStatusChip } from "@/components/collector/submission-status-chip";
import { WasteTypeBadge } from "@/components/org-admin/waste-type-badge";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { collectorService } from "@/lib/services/collector-service";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type CollectorSubmissionQuery } from "@/types/collector";

export default function CollectorSubmissionsPage() {
  const [query, setQuery] = useState<CollectorSubmissionQuery>({
    search: "",
    status: "ALL",
    wasteType: "ALL",
    dateWindow: "ALL",
  });

  const submissions = useAsyncResource(
    () => collectorService.getSubmissions(query),
    [query.search, query.status, query.wasteType, query.dateWindow],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Submissions"
        description="Track all your waste submissions and monitor status updates."
        actions={
          <Link href="/collector/submissions/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Submission
            </Button>
          </Link>
        }
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search by reference, zone, point"
        filters={
          <>
            <Select
              value={query.status ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, status: event.target.value as CollectorSubmissionQuery["status"] }))}
              className="w-[170px]"
            >
              <option value="ALL">All Statuses</option>
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
              onChange={(event) => setQuery((prev) => ({ ...prev, wasteType: event.target.value as CollectorSubmissionQuery["wasteType"] }))}
              className="w-[150px]"
            >
              <option value="ALL">All Types</option>
              <option value="ORGANIC">Organic</option>
              <option value="PLASTIC">Plastic</option>
            </Select>

            <Select
              value={query.dateWindow ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, dateWindow: event.target.value as CollectorSubmissionQuery["dateWindow"] }))}
              className="w-[150px]"
            >
              <option value="ALL">All Dates</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </Select>
          </>
        }
      />

      {submissions.error ? <ErrorState message={submissions.error} onRetry={() => void submissions.reload()} /> : null}

      {submissions.loading || !submissions.data ? (
        <LoadingState rows={7} />
      ) : submissions.data.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title="No submissions found"
          message="Adjust your filters or create a new submission to get started."
        />
      ) : (
        <>
          <div className="grid gap-2 md:hidden">
            {submissions.data.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable headers={["Reference", "Type", "Weight", "Zone", "Submitted", "Status", "Action"]}>
              {submissions.data.map((submission) => (
                <tr key={submission.id} className="hover:bg-surface-soft/60">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{submission.reference}</td>
                  <td className="px-4 py-3"><WasteTypeBadge type={submission.wasteType} /></td>
                  <td className="px-4 py-3 text-sm text-foreground">{formatWeightKg(submission.weightKg)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{submission.zone}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(submission.submittedAt)}</td>
                  <td className="px-4 py-3"><SubmissionStatusChip status={submission.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/collector/submissions/${submission.id}`}>
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
