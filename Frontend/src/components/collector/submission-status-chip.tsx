import { StatusBadge } from "@/components/platform/status-badge";
import { type CollectorSubmissionStatus } from "@/types/collector";

export function SubmissionStatusChip({ status }: { status: CollectorSubmissionStatus }) {
  return <StatusBadge status={status} />;
}
