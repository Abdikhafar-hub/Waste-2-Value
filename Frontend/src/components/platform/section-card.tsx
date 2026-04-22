import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  compact?: boolean;
}

export function SectionCard({ title, subtitle, actions, children, compact }: SectionCardProps) {
  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}
