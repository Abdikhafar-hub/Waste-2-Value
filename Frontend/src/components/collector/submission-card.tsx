import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SubmissionStatusChip } from "@/components/collector/submission-status-chip";
import { WasteTypeBadge } from "@/components/org-admin/waste-type-badge";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type CollectorSubmission } from "@/types/collector";

export function SubmissionCard({ submission }: { submission: CollectorSubmission }) {
  return (
    <Link
      href={`/collector/submissions/${submission.id}`}
      className="block rounded-xl border border-border bg-white p-3 shadow-xs transition hover:bg-surface-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{submission.reference}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(submission.submittedAt)}</p>
        </div>
        <SubmissionStatusChip status={submission.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <WasteTypeBadge type={submission.wasteType} />
        <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-foreground">
          {formatWeightKg(submission.weightKg)}
        </span>
        <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
          {submission.zone}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{submission.collectionPoint ?? "No collection point"}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand">
          View <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
