import { cn, formatDateTime } from "@/lib/utils";
import { type WasteSubmission } from "@/types/org-admin";

export function PipelineTimeline({ submission }: { submission: WasteSubmission }) {
  return (
    <div className="space-y-3">
      {submission.timeline.map((step, index) => {
        const isLast = index === submission.timeline.length - 1;

        return (
          <div key={`${step.status}_${step.at}`} className="relative flex gap-3">
            <div className="relative">
              <span className="mt-1 block h-2.5 w-2.5 rounded-full bg-brand" />
              {!isLast ? <span className="absolute left-[4px] top-4 h-[calc(100%-10px)] w-px bg-border" /> : null}
            </div>
            <div className={cn("pb-2", !isLast && "mb-1")}> 
              <p className="text-sm font-semibold text-foreground">{step.status.replaceAll("_", " ")}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(step.at)} by {step.actor}</p>
              {step.note ? <p className="mt-1 text-xs text-muted-foreground">{step.note}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
