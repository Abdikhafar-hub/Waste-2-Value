import { cn } from "@/lib/utils";
import { type BuyerProductAvailability } from "@/types/buyer";

const styleMap: Record<BuyerProductAvailability, string> = {
  IN_STOCK: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  LOW_STOCK: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  OUT_OF_STOCK: "bg-[#fff2f0] text-[#b42318] border-[#f4c7c2]",
};

export function AvailabilityBadge({ availability }: { availability: BuyerProductAvailability }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        styleMap[availability],
      )}
    >
      {availability.replaceAll("_", " ")}
    </span>
  );
}
