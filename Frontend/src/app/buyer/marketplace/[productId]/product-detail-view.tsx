"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { AvailabilityBadge } from "@/components/buyer/availability-badge";
import { OrderStatusChip } from "@/components/buyer/order-status-chip";
import { PurchasePanel } from "@/components/buyer/purchase-panel";
import { DeliveryStatusChip } from "@/components/buyer/delivery-status-chip";
import { PaymentStatusChip } from "@/components/buyer/payment-status-chip";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { buyerService } from "@/lib/services/buyer-service";
import { formatCurrency } from "@/lib/utils";

export function ProductDetailView({ productId }: { productId: string }) {
  const [createdOrder, setCreatedOrder] = useState<{ id: string; reference: string } | null>(null);

  const product = useAsyncResource(() => buyerService.getProductById(productId), [productId]);
  const createOrderAction = useAsyncAction((payload: { quantity: number; notes?: string }) =>
    buyerService.createOrder({ productId, quantity: payload.quantity, notes: payload.notes }),
  );

  const handleCreateOrder = async (payload: { quantity: number; notes?: string }) => {
    const order = await createOrderAction.execute(payload);
    setCreatedOrder({ id: order.id, reference: order.reference });
    await product.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Product Detail"
        description="Review commercial product information and place an order with confidence."
        actions={
          <Link href="/buyer/marketplace">
            <Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
        }
      />

      {product.error ? <ErrorState message={product.error} onRetry={() => void product.reload()} /> : null}
      {createOrderAction.error ? <ErrorState message={createOrderAction.error} /> : null}

      {createdOrder ? (
        <SectionCard title="Order submitted" subtitle="Your purchase request has been created" compact>
          <div className="rounded-xl border border-[#c9e5d5] bg-[#eaf7f0] p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">{createdOrder.reference} created successfully</p>
            <p className="mt-1 text-xs text-muted-foreground">Track payment and delivery progress from your orders page.</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/buyer/orders/${createdOrder.id}`}>
                <Button size="sm">Open Order</Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={() => setCreatedOrder(null)}>Create Another</Button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {product.loading || !product.data ? (
        <LoadingState rows={8} />
      ) : (
        <>
          <SectionCard
            title={product.data.name}
            subtitle={product.data.description}
            actions={<AvailabilityBadge availability={product.data.availability} />}
            compact
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Category" value={product.data.category.replaceAll("_", " ")} />
              <StatBlock label="Unit" value={product.data.unit} />
              <StatBlock label="Price" value={formatCurrency(product.data.price)} />
              <StatBlock label="Available" value={`${product.data.availableQuantity}`} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-muted-foreground">
                Producer: {product.data.producerOrganization}
              </span>
            </div>
          </SectionCard>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <SectionCard title="Commercial Summary" subtitle="Ordering and availability context" compact>
              <div className="space-y-3 text-sm text-foreground">
                <p>{product.data.description}</p>
                <div className="rounded-lg border border-border bg-surface-soft p-3 text-xs text-muted-foreground">
                  This listing is supplied through verified Waste2Value organizational processing outputs with
                  stock-aware ordering controls.
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-white p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Order Status</p>
                    <div className="mt-1 inline-flex"><OrderStatusChip status="PLACED" /></div>
                  </div>
                  <div className="rounded-md border border-border bg-white p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Payment</p>
                    <div className="mt-1 inline-flex"><PaymentStatusChip status="PENDING" /></div>
                  </div>
                  <div className="rounded-md border border-border bg-white p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Delivery</p>
                    <div className="mt-1 inline-flex"><DeliveryStatusChip status="PENDING" /></div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <PurchasePanel
              product={product.data}
              loading={createOrderAction.loading}
              onSubmit={handleCreateOrder}
            />
          </section>
        </>
      )}
    </div>
  );
}
