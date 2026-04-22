import { cn } from "@/lib/utils";
import { type WasteType } from "@/types/org-admin";

const wasteTypeStyles: Record<WasteType, string> = {
  ORGANIC: "bg-[#eaf7f0] border-[#c9e5d5] text-[#11643c]",
  PLASTIC: "bg-[#eaf4ff] border-[#cfe2f8] text-[#215391]",
  PAPER: "bg-[#f7f2e8] border-[#eadbc1] text-[#7a5920]",
  METAL: "bg-[#f4f5f7] border-[#dfe2e7] text-[#4b5563]",
  GLASS: "bg-[#ecf8fb] border-[#c9e6ee] text-[#1d6175]",
};

export function WasteTypeBadge({ type }: { type: WasteType }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", wasteTypeStyles[type])}>
      {type}
    </span>
  );
}
