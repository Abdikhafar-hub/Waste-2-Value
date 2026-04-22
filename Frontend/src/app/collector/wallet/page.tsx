"use client";

import { WalletCards } from "lucide-react";
import { useState } from "react";
import { TransactionItem } from "@/components/collector/transaction-item";
import { WalletSummaryCard } from "@/components/collector/wallet-summary-card";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { collectorService } from "@/lib/services/collector-service";
import { formatDateTime } from "@/lib/utils";
import { type CreateCollectorRedemptionInput } from "@/types/collector";

export default function CollectorWalletPage() {
  const wallet = useAsyncResource(() => collectorService.getWalletData(), []);
  const requestRedemption = useAsyncAction((payload: CreateCollectorRedemptionInput) =>
    collectorService.requestRedemption(payload),
  );

  const [openRequest, setOpenRequest] = useState(false);
  const [amount, setAmount] = useState("");
  const [requestedItem, setRequestedItem] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!requestedItem.trim() || Number(amount) <= 0) {
      setFormError("Requested amount and item are required.");
      return;
    }

    setFormError(null);

    await requestRedemption.execute({
      amount: Number(amount),
      requestedItem: requestedItem.trim(),
      notes: notes.trim() || undefined,
    });

    setOpenRequest(false);
    setAmount("");
    setRequestedItem("");
    setNotes("");
    await wallet.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Wallet"
        description="Monitor credits, redemptions, and recent wallet transactions."
        actions={<Button size="sm" onClick={() => setOpenRequest(true)}>Request Redemption</Button>}
      />

      {wallet.error ? <ErrorState message={wallet.error} onRetry={() => void wallet.reload()} /> : null}
      {requestRedemption.error ? <ErrorState message={requestRedemption.error} /> : null}

      {wallet.loading || !wallet.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <WalletSummaryCard label="Current Balance" value={`${wallet.data.balance} credits`} />
            <WalletSummaryCard label="Total Earned" value={`${wallet.data.totalEarned} credits`} />
            <WalletSummaryCard label="Pending Redemptions" value={String(wallet.data.pendingRedemptions)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <SectionCard title="Recent Transactions" subtitle="Latest credit and redemption events" compact>
              {wallet.data.transactions.length === 0 ? (
                <EmptyState
                  icon={WalletCards}
                  title="No wallet transactions"
                  message="Your wallet activity will appear here once transactions happen."
                />
              ) : (
                <div className="space-y-2">
                  {wallet.data.transactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Redemption Requests" subtitle="Track your request statuses" compact>
              {wallet.data.redemptions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                  No redemption requests yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {wallet.data.redemptions.map((request) => (
                    <div key={request.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{request.requestedItem}</p>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{request.amount} credits</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </section>
        </>
      )}

      {openRequest ? (
        <Modal
          open={openRequest}
          onClose={() => setOpenRequest(false)}
          title="Request Redemption"
          description="Submit a credit redemption request for review."
          className="max-w-md"
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount (credits)</label>
              <Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min={1} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requested Item</label>
              <Input value={requestedItem} onChange={(event) => setRequestedItem(event.target.value)} placeholder="Mobile airtime" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes (optional)</label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Any extra request detail" />
            </div>
            {formError ? <p className="text-sm text-danger">{formError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpenRequest(false)}>Cancel</Button>
              <Button onClick={() => void handleRequest()} loading={requestRedemption.loading}>Submit Request</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
