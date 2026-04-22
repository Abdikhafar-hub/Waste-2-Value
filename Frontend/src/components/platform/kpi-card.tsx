import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
}

export function KpiCard({ label, value, trend, icon }: KpiCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">{value}</p>
          {trend ? <p className="mt-1 text-xs text-muted-foreground">{trend}</p> : null}
        </div>
        {icon ? <div className="rounded-md bg-surface-soft p-2 text-brand">{icon}</div> : null}
      </div>
    </Card>
  );
}
