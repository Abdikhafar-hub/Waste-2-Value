import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BatchStatusChip } from "@/components/processor/batch-status-chip";
import { formatDateTime, formatWeightKg } from "@/lib/utils";
import { type ProcessorBatch } from "@/types/processor";

export function BatchCard({ batch }: { batch: ProcessorBatch }) {
  return (
    <Link
      href={`/processor/batches/${batch.id}`}
      className="block rounded-xl border border-border bg-white p-3 shadow-xs transition hover:bg-surface-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{batch.reference}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(batch.startedAt)}</p>
        </div>
        <BatchStatusChip status={batch.status} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>Type: {batch.wasteType}</span>
        <span>Input: {formatWeightKg(batch.inputWeightKg)}</span>
        <span>Outputs: {batch.outputs.length}</span>
        <span>Center: {batch.processingCenter}</span>
      </div>

      <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
        View batch <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}
