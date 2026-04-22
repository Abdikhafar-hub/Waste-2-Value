"use client";

import Link from "next/link";
import { PackageCheck, ShoppingBag, Store } from "lucide-react";
import { AvailabilityBadge } from "@/components/buyer/availability-badge";
import { DeliveryStatusChip } from "@/components/buyer/delivery-status-chip";
import { OrderStatusChip } from "@/components/buyer/order-status-chip";
import { OrderSummaryCard } from "@/components/buyer/order-summary-card";
import { PaymentStatusChip } from "@/components/buyer/payment-status-chip";
import { ProductCard } from "@/components/buyer/product-card";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { buyerService } from "@/lib/services/buyer-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function BuyerDashboardPage() {
  const dashboard = useAsyncResource(() => buyerService.getDashboardData(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Buyer Dashboard"
        description="Monitor orders and continue purchasing from available marketplace output."
        actions={
          <>
            <Link href="/buyer/marketplace">
              <Button size="sm"><Store className="h-4 w-4" />Browse Marketplace</Button>
            </Link>
            <Link href="/buyer/orders">
              <Button size="sm" variant="secondary"><ShoppingBag className="h-4 w-4" />View Orders</Button>
            </Link>
          </>
        }
      />

      {dashboard.error ? <ErrorState message={dashboard.error} onRetry={() => void dashboard.reload()} /> : null}

      {dashboard.loading || !dashboard.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OrderSummaryCard label="Total Orders" value={String(dashboard.data.metrics.totalOrders)} />
            <OrderSummaryCard label="Active Orders" value={String(dashboard.data.metrics.activeOrders)} />
            <OrderSummaryCard label="Delivered" value={String(dashboard.data.metrics.deliveredOrders)} />
            <OrderSummaryCard label="Total Spend" value={formatCurrency(dashboard.data.metrics.totalSpend)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <SectionCard title="Recent Orders" subtitle="Latest marketplace purchases" compact>
              {dashboard.data.recentOrders.length === 0 ? (
                <EmptyState
                  icon={PackageCheck}
                  title="No orders yet"
                  message="Place your first order from the marketplace to start tracking purchases."
                />
              ) : (
                <>
                  <div className="grid gap-2 md:hidden">
                    {dashboard.data.recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/buyer/orders/${order.id}`}
                        className="rounded-lg border border-border bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{order.reference}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                          </div>
                          <OrderStatusChip status={order.orderStatus} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <PaymentStatusChip status={order.paymentStatus} />
                          <DeliveryStatusChip status={order.deliveryStatus} />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                      </Link>
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <DataTable headers={["Order", "Created", "Total", "Order", "Payment", "Delivery", "Action"]}>
                      {dashboard.data.recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-soft/60">
                          <td className="px-4 py-3 text-sm font-semibold text-foreground">{order.reference}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(order.totalAmount)}</td>
                          <td className="px-4 py-3"><OrderStatusChip status={order.orderStatus} /></td>
                          <td className="px-4 py-3"><PaymentStatusChip status={order.paymentStatus} /></td>
                          <td className="px-4 py-3"><DeliveryStatusChip status={order.deliveryStatus} /></td>
                          <td className="px-4 py-3">
                            <Link href={`/buyer/orders/${order.id}`}>
                              <Button size="sm" variant="secondary">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard title="Featured Products" subtitle="Popular available outputs to reorder quickly" compact>
              {dashboard.data.featuredProducts.length === 0 ? (
                <EmptyState
                  icon={Store}
                  title="No featured products"
                  message="Featured listings will appear once product inventory is published."
                />
              ) : (
                <div className="space-y-2">
                  {dashboard.data.featuredProducts.map((product) => (
                    <div key={product.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category.replaceAll("_", " ")} • {product.unit}</p>
                        </div>
                        <AvailabilityBadge availability={product.availability} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(product.price)}</p>
                        <Link href={`/buyer/marketplace/${product.id}`}>
                          <Button size="sm" variant="secondary">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </section>

          <SectionCard title="Quick Actions" subtitle="Continue purchasing without friction" compact>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link href="/buyer/marketplace" className="rounded-lg border border-border bg-surface-soft p-3 transition hover:bg-white">
                <p className="text-sm font-semibold text-foreground">Browse products</p>
                <p className="mt-1 text-xs text-muted-foreground">Explore available listings by category.</p>
              </Link>
              <Link href="/buyer/orders" className="rounded-lg border border-border bg-surface-soft p-3 transition hover:bg-white">
                <p className="text-sm font-semibold text-foreground">Track orders</p>
                <p className="mt-1 text-xs text-muted-foreground">Review status, payment, and delivery updates.</p>
              </Link>
              <Link href="/buyer/marketplace" className="rounded-lg border border-border bg-surface-soft p-3 transition hover:bg-white">
                <p className="text-sm font-semibold text-foreground">Reorder stock</p>
                <p className="mt-1 text-xs text-muted-foreground">Place repeat orders for consistent supply lines.</p>
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Marketplace Snapshot" subtitle="Commercial inventory preview" compact>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.data.featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
