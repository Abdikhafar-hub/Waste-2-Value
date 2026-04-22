import { ArrowDownLeft, ArrowUpRight, Clock3, XCircle } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { type CollectorWalletTransaction } from "@/types/collector";

function signLabel(amount: number) {
  return amount > 0 ? `+${amount}` : String(amount);
}

export function TransactionItem({ transaction }: { transaction: CollectorWalletTransaction }) {
  const icon =
    transaction.status === "FAILED" ? (
      <XCircle className="h-4 w-4" />
    ) : transaction.status === "PENDING" ? (
      <Clock3 className="h-4 w-4" />
    ) : transaction.amount >= 0 ? (
      <ArrowUpRight className="h-4 w-4" />
    ) : (
      <ArrowDownLeft className="h-4 w-4" />
    );

  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-brand">
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{transaction.type.replaceAll("_", " ")}</p>
            <p className="text-xs text-muted-foreground">{transaction.context}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-sm font-semibold",
            transaction.amount >= 0 ? "text-[#11643c]" : "text-foreground",
          )}
        >
          {signLabel(transaction.amount)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{transaction.reference ?? "No reference"}</span>
        <span>{formatDateTime(transaction.createdAt)}</span>
      </div>
    </div>
  );
}
