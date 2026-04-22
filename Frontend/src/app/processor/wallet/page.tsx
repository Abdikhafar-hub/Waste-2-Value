"use client";

import { WalletCards } from "lucide-react";
import { useState } from "react";
import { ProcessorTransactionItem } from "@/components/processor/processor-transaction-item";
import { ProductionSummaryCard } from "@/components/processor/production-summary-card";
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
import { processorService } from "@/lib/services/processor-service";
import { formatDateTime } from "@/lib/utils";
import { type CreateProcessorRedemptionInput } from "@/types/processor";

export default function ProcessorWalletPage() {
  const wallet = useAsyncResource(() => processorService.getWalletData(), []);
  const requestRedemption = useAsyncAction((payload: CreateProcessorRedemptionInput) =>
    processorService.requestRedemption(payload),
  );

  const [openRequest, setOpenRequest] = useState(false);
  const [amount, setAmount] = useState("");
  const [requestedItem, setRequestedItem] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequest = async () => {
    if (Number(amount) <= 0 || !requestedItem.trim()) {
      setFormError("Requested amount and item are required.");
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      await requestRedemption.execute({
        amount: Number(amount),
        requestedItem: requestedItem.trim(),
        notes: notes.trim() || undefined,
      });

      setSuccessMessage("Redemption request submitted for review.");
      setOpenRequest(false);
      setAmount("");
      setRequestedItem("");
      setNotes("");
      await wallet.reload();
    } catch {
      // Error rendered via useAsyncAction state.
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Wallet"
        description="Review earnings, transaction history, and redemption requests tied to your production work."
        actions={<Button size="sm" onClick={() => setOpenRequest(true)}>Request Redemption</Button>}
      />

      {wallet.error ? <ErrorState message={wallet.error} onRetry={() => void wallet.reload()} /> : null}
      {requestRedemption.error ? <ErrorState message={requestRedemption.error} /> : null}

      {successMessage ? (
        <div className="rounded-xl border border-[#c9e5d5] bg-[#eaf7f0] px-4 py-3 text-sm text-[#11643c]">
          {successMessage}
        </div>
      ) : null}

      {wallet.loading || !wallet.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <ProductionSummaryCard label="Current Credits" value={`${wallet.data.balance}`} />
            <ProductionSummaryCard label="Total Earned" value={`${wallet.data.totalEarned}`} />
            <ProductionSummaryCard label="Pending Redemptions" value={String(wallet.data.pendingRedemptions)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <SectionCard title="Recent Transactions" subtitle="Credit earnings and redemption movements" compact>
              {wallet.data.transactions.length === 0 ? (
                <EmptyState
                  icon={WalletCards}
                  title="No wallet activity"
                  message="Transactions will appear here as credits are earned and redeemed."
                />
              ) : (
                <div className="space-y-2">
                  {wallet.data.transactions.map((transaction) => (
                    <ProcessorTransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Redemption Requests" subtitle="Track payout requests and statuses" compact>
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
                      {request.notes ? <p className="mt-1 text-xs text-muted-foreground">{request.notes}</p> : null}
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
          description="Submit a redemption request for approval by your organization team."
          className="max-w-md"
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount (credits)</label>
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min={1}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requested Item</label>
              <Input
                value={requestedItem}
                onChange={(event) => setRequestedItem(event.target.value)}
                placeholder="Cash payout"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any delivery or payout note"
              />
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
