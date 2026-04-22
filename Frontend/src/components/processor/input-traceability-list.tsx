import { AssignmentStatusChip } from "@/components/processor/assignment-status-chip";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type ProcessorAssignment } from "@/types/processor";

export function InputTraceabilityList({ inputs }: { inputs: ProcessorAssignment[] }) {
  return (
    <div className="space-y-2">
      {inputs.map((input) => (
        <div key={input.id} className="rounded-lg border border-border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{input.reference}</p>
              <p className="text-xs text-muted-foreground">{input.collectorName} • {input.zone}</p>
            </div>
            <AssignmentStatusChip status={input.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-surface-soft px-2 py-1">{input.wasteType}</span>
            <span className="rounded-full border border-border bg-surface-soft px-2 py-1">{formatWeightKg(input.weightKg)}</span>
            <span className="rounded-full border border-border bg-surface-soft px-2 py-1">{formatDateTime(input.assignedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
