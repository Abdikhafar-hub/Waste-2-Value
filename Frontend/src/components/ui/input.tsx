import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[10px] border bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground",
        hasError ? "border-danger focus:ring-4 focus:ring-danger/15" : "border-border focus:border-brand focus:ring-4 focus:ring-brand/15",
        className,
      )}
      {...props}
    />
  );
}
