interface WalletSummaryCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function WalletSummaryCard({ label, value, helper }: WalletSummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
