import { StatusBadge } from "@/components/platform/status-badge";
import { type ProcessorAssignmentStatus } from "@/types/processor";

export function AssignmentStatusChip({ status }: { status: ProcessorAssignmentStatus }) {
  return <StatusBadge status={status} />;
}
