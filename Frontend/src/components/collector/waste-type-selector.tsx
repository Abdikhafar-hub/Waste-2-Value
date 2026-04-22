import { Recycle, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CollectorWasteType } from "@/types/collector";

interface WasteTypeSelectorProps {
  value: CollectorWasteType;
  onChange: (value: CollectorWasteType) => void;
}

export function WasteTypeSelector({ value, onChange }: WasteTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("ORGANIC")}
        className={cn(
          "rounded-xl border px-3 py-3 text-left transition",
          value === "ORGANIC"
            ? "border-[#b8dfca] bg-[#e9f7ef] text-[#11643c]"
            : "border-border bg-white text-foreground",
        )}
      >
        <Sprout className="mb-1 h-4 w-4" />
        <p className="text-sm font-semibold">Organic</p>
        <p className="text-xs text-muted-foreground">Food and organic waste</p>
      </button>

      <button
        type="button"
        onClick={() => onChange("PLASTIC")}
        className={cn(
          "rounded-xl border px-3 py-3 text-left transition",
          value === "PLASTIC"
            ? "border-[#b8d4f2] bg-[#edf5ff] text-[#1d4f91]"
            : "border-border bg-white text-foreground",
        )}
      >
        <Recycle className="mb-1 h-4 w-4" />
        <p className="text-sm font-semibold">Plastic</p>
        <p className="text-xs text-muted-foreground">Sorted recyclable plastic</p>
      </button>
    </div>
  );
}
