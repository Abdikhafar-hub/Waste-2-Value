"use client";

import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { useState } from "react";
import { DeliveryStatusChip } from "@/components/buyer/delivery-status-chip";
import { OrderStatusChip } from "@/components/buyer/order-status-chip";
import { PaymentStatusChip } from "@/components/buyer/payment-status-chip";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { buyerService } from "@/lib/services/buyer-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { type BuyerOrderQuery } from "@/types/buyer";

export default function BuyerOrdersPage() {
  const [query, setQuery] = useState<BuyerOrderQuery>({
    search: "",
    orderStatus: "ALL",
    paymentStatus: "ALL",
    deliveryStatus: "ALL",
  });

  const orders = useAsyncResource(
    () => buyerService.getOrders(query),
    [query.search, query.orderStatus, query.paymentStatus, query.deliveryStatus],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        description="Track all buyer orders, payment progress, and delivery visibility in one place."
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search by order reference or product"
        filters={
          <>
            <Select
              value={query.orderStatus ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, orderStatus: event.target.value as BuyerOrderQuery["orderStatus"] }))}
              className="w-[170px]"
            >
              <option value="ALL">All Order Status</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FULFILLING">Fulfilling</option>
              <option value="COMPLETED">Completed</option>
            </Select>

            <Select
              value={query.paymentStatus ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, paymentStatus: event.target.value as BuyerOrderQuery["paymentStatus"] }))}
              className="w-[170px]"
            >
              <option value="ALL">All Payment</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </Select>

            <Select
              value={query.deliveryStatus ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, deliveryStatus: event.target.value as BuyerOrderQuery["deliveryStatus"] }))}
              className="w-[170px]"
            >
              <option value="ALL">All Delivery</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
            </Select>
          </>
        }
      />

      {orders.error ? <ErrorState message={orders.error} onRetry={() => void orders.reload()} /> : null}

      {orders.loading || !orders.data ? (
        <LoadingState rows={8} />
      ) : orders.data.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No orders found"
          message="Adjust filters or place a new order from marketplace products."
        />
      ) : (
        <>
          <div className="grid gap-2 md:hidden">
            {orders.data.map((order) => (
              <Link key={order.id} href={`/buyer/orders/${order.id}`} className="rounded-lg border border-border bg-white p-3">
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
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{order.itemCount} items</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable headers={["Reference", "Created", "Items", "Total", "Order", "Payment", "Delivery", "Action"]}>
              {orders.data.map((order) => (
                <tr key={order.id} className="hover:bg-surface-soft/60">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{order.reference}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{order.itemCount}</td>
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
    </div>
  );
}
