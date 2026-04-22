import { type ReactNode } from "react";

interface OperationalActionPanelProps {
  title: string;
  description?: string;
  actions: ReactNode;
}

export function OperationalActionPanel({ title, description, actions }: OperationalActionPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-soft p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
