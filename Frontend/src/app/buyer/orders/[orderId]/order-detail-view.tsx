"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { BuyerOrderTimeline } from "@/components/buyer/buyer-order-timeline";
import { DeliveryStatusChip } from "@/components/buyer/delivery-status-chip";
import { OrderStatusChip } from "@/components/buyer/order-status-chip";
import { PaymentStatusChip } from "@/components/buyer/payment-status-chip";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { buyerService } from "@/lib/services/buyer-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function OrderDetailView({ orderId }: { orderId: string }) {
  const order = useAsyncResource(() => buyerService.getOrderById(orderId), [orderId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Order Detail"
        description="Complete order visibility across status, payment, and delivery progress."
        actions={
          <Link href="/buyer/orders">
            <Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />

      {order.error ? <ErrorState message={order.error} onRetry={() => void order.reload()} /> : null}

      {order.loading || !order.data ? (
        <LoadingState rows={8} />
      ) : (
        <>
          <SectionCard title={order.data.reference} subtitle={`Created ${formatDateTime(order.data.createdAt)}`} compact>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Total" value={formatCurrency(order.data.totalAmount)} />
              <StatBlock label="Items" value={String(order.data.itemCount)} />
              <StatBlock label="Organization" value={order.data.buyerOrganization} />
              <StatBlock label="Created" value={formatDateTime(order.data.createdAt)} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OrderStatusChip status={order.data.orderStatus} />
              <PaymentStatusChip status={order.data.paymentStatus} />
              <DeliveryStatusChip status={order.data.deliveryStatus} />
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <SectionCard title="Order Items" subtitle="Itemized line summary" compact>
              <div className="space-y-2">
                {order.data.lines.map((line, index) => (
                  <div key={`${line.productId}_${index}`} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{line.productName}</p>
                        <p className="text-xs text-muted-foreground">{line.quantity} {line.unit} × {formatCurrency(line.unitPrice)}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(line.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-border bg-surface-soft p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.data.totalAmount)}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Fulfillment Visibility" subtitle="Current commercial transaction state" compact>
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Order status</p>
                  <div className="mt-1 inline-flex"><OrderStatusChip status={order.data.orderStatus} /></div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Payment status</p>
                  <div className="mt-1 inline-flex"><PaymentStatusChip status={order.data.paymentStatus} /></div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Delivery status</p>
                  <div className="mt-1 inline-flex"><DeliveryStatusChip status={order.data.deliveryStatus} /></div>
                </div>
                {order.data.notes ? (
                  <div className="rounded-lg border border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    {order.data.notes}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    No special order notes were attached.
                  </p>
                )}
              </div>
            </SectionCard>
          </section>

          <SectionCard title="Order Timeline" subtitle="Status progression from placement to delivery" compact>
            <BuyerOrderTimeline items={order.data.timeline} />
          </SectionCard>

          <SectionCard title="Need More Products?" subtitle="Continue sourcing from marketplace listings" compact>
            <Link href="/buyer/marketplace" className="inline-flex">
              <Button variant="secondary"><ShoppingBag className="h-4 w-4" />Back to Marketplace</Button>
            </Link>
          </SectionCard>
        </>
      )}
    </div>
  );
}
