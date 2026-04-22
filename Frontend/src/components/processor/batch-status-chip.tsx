import { StatusBadge } from "@/components/platform/status-badge";
import { type ProcessorBatchStatus } from "@/types/processor";

export function BatchStatusChip({ status }: { status: ProcessorBatchStatus }) {
  return <StatusBadge status={status} />;
}
