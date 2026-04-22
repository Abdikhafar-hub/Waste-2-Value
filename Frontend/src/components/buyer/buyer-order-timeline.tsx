import { formatDateTime } from "@/lib/utils";
import { type BuyerOrderTimelineItem } from "@/types/buyer";

export function BuyerOrderTimeline({ items }: { items: BuyerOrderTimelineItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-3">
            <div className="relative">
              <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-brand" />
              {!isLast ? <span className="absolute left-[4px] top-4 h-[calc(100%-10px)] w-px bg-border" /> : null}
            </div>
            <div className="pb-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.status.replaceAll("_", " ")} • {formatDateTime(item.at)}
              </p>
              {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
