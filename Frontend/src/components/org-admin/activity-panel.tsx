import { formatDateTime } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  subtitle?: string;
  at: string;
}

export function ActivityPanel({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border p-3">
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          {item.subtitle ? <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p> : null}
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
        </div>
      ))}
    </div>
  );
}
