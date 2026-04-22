import { StatusBadge } from "@/components/platform/status-badge";
import { type BuyerPaymentStatus } from "@/types/buyer";

export function PaymentStatusChip({ status }: { status: BuyerPaymentStatus }) {
  return <StatusBadge status={status} />;
}
