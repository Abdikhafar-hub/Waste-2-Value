import { type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ className, hasError, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[104px] w-full rounded-[10px] border bg-white px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground",
        hasError ? "border-danger focus:ring-4 focus:ring-danger/15" : "border-border focus:border-brand focus:ring-4 focus:ring-brand/15",
        className,
      )}
      {...props}
    />
  );
}
