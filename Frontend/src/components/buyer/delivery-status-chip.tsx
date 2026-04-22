import { StatusBadge } from "@/components/platform/status-badge";
import { type BuyerDeliveryStatus } from "@/types/buyer";

export function DeliveryStatusChip({ status }: { status: BuyerDeliveryStatus }) {
  return <StatusBadge status={status} />;
}
