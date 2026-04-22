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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}
