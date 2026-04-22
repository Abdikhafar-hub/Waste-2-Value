import { type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFilterToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function SearchFilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
}: SearchFilterToolbarProps) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-white p-3 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder ?? "Search"}
            className="pl-9"
          />
        </div>
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
