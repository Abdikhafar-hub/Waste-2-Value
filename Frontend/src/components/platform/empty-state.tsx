import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon: LucideIcon;
}

export function EmptyState({ title, message, icon: Icon }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-soft p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand shadow-xs">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
