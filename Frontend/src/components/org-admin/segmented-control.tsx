import { cn } from "@/lib/utils";

interface SegmentOption<TValue extends string> {
  label: string;
  value: TValue;
}

interface SegmentedControlProps<TValue extends string> {
  value: TValue;
  onChange: (value: TValue) => void;
  options: SegmentOption<TValue>[];
}

export function SegmentedControl<TValue extends string>({ value, onChange, options }: SegmentedControlProps<TValue>) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition",
            value === option.value ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
