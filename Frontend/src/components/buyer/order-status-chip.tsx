import { cn } from "@/lib/utils";
import { type BuyerOrderStatus } from "@/types/buyer";

const styleMap: Record<BuyerOrderStatus, string> = {
  PLACED: "bg-[#eef6ff] text-[#1d4f91] border-[#cde1f9]",
  CONFIRMED: "bg-[#eaf4ff] text-[#215391] border-[#cfe2f8]",
  FULFILLING: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  COMPLETED: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
};

export function OrderStatusChip({ status }: { status: BuyerOrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        styleMap[status],
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
