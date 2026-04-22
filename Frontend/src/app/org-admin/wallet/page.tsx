"use client";

import { WalletCards } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatDateTime } from "@/lib/utils";
import { type RedemptionRequest } from "@/types/org-admin";

export default function WalletPage() {
  const [selectedRequest, setSelectedRequest] = useState<RedemptionRequest | undefined>();
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);

  const wallet = useAsyncResource(() => orgAdminService.getWalletOverview(), []);
  const reviewAction = useAsyncAction((requestId: string, status: "APPROVED" | "REJECTED") =>
    orgAdminService.reviewRedemption(requestId, status),
  );

  const handleDecision = async () => {
    if (!selectedRequest || !decision) {
      return;
    }

    await reviewAction.execute(selectedRequest.id, decision);
    setSelectedRequest(undefined);
    setDecision(null);
    await wallet.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Wallet & Redemptions"
        description="Auditable oversight of issued credits, redemption requests, and wallet activity."
      />

      {wallet.error ? <ErrorState message={wallet.error} onRetry={() => void wallet.reload()} /> : null}

      {wallet.loading || !wallet.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Credits Issued</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{wallet.data.summary.creditsIssued}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending Requests</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{wallet.data.summary.pendingRedemptions}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approved Requests</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{wallet.data.summary.approvedRedemptions}</p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Redemption Requests" subtitle="Approve or reject pending requests" compact>
              {wallet.data.requests.length === 0 ? (
                <EmptyState icon={WalletCards} title="No redemption requests" message="There are no redemption requests at the moment." />
              ) : (
                <DataTable headers={["User", "Amount", "Requested Item", "Created", "Status", "Actions"]}>
                  {wallet.data.requests.map((request) => (
                    <tr key={request.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{request.userName}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{request.amount}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{request.requestedItem}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDecision("APPROVED");
                            }}
                            disabled={request.status !== "PENDING"}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#f4c7c2] px-2.5 py-1 text-xs font-semibold text-danger"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDecision("REJECTED");
                            }}
                            disabled={request.status !== "PENDING"}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </SectionCard>

            <SectionCard title="Recent Wallet Activity" subtitle="Latest credit and redemption events" compact>
              <div className="space-y-2">
                {wallet.data.transactions.map((tx) => (
                  <div key={tx.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{tx.type.replaceAll("_", " ")}</p>
                      <span className="text-sm font-semibold text-foreground">{tx.amount}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{tx.userName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{tx.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>
        </>
      )}

      <ConfirmDialog
        open={Boolean(selectedRequest && decision)}
        title={decision === "APPROVED" ? "Approve redemption?" : "Reject redemption?"}
        message={decision === "APPROVED" ? "Credits will be redeemed for this request." : "Request will be marked rejected."}
        confirmLabel={decision === "APPROVED" ? "Approve" : "Reject"}
        onClose={() => {
          setSelectedRequest(undefined);
          setDecision(null);
        }}
        onConfirm={handleDecision}
        loading={reviewAction.loading}
        danger={decision === "REJECTED"}
      />
    </div>
  );
}
