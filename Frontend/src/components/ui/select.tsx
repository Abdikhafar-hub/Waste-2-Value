import { type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({ className, hasError, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-[10px] border bg-white px-3 text-sm text-foreground outline-none transition",
        hasError ? "border-danger focus:ring-4 focus:ring-danger/15" : "border-border focus:border-brand focus:ring-4 focus:ring-brand/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
