import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-border bg-white text-brand accent-brand focus-visible:ring-4 focus-visible:ring-brand/20",
        className,
      )}
      {...props}
    />
  );
}
