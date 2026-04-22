"use client";

import { PackageCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { type Order, type OrderQuery } from "@/types/org-admin";

export default function OrdersPage() {
  const [query, setQuery] = useState<OrderQuery>({ search: "", paymentStatus: "ALL", deliveryStatus: "ALL" });
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [nextDeliveryStatus, setNextDeliveryStatus] = useState<Order["deliveryStatus"]>("PENDING");

  const orders = useAsyncResource(() => orgAdminService.getOrders(query), [query.search, query.paymentStatus, query.deliveryStatus]);
  const updateDeliveryAction = useAsyncAction((orderId: string, status: Order["deliveryStatus"]) =>
    orgAdminService.updateOrderDeliveryStatus(orderId, status),
  );

  const summary = useMemo(() => {
    const list = orders.data ?? [];
    return {
      totalOrders: list.length,
      paidRevenue: list.filter((item) => item.paymentStatus === "PAID").reduce((sum, item) => sum + item.total, 0),
      pendingDelivery: list.filter((item) => item.deliveryStatus !== "DELIVERED").length,
    };
  }, [orders.data]);

  const handleUpdateDelivery = async () => {
    if (!selectedOrder) {
      return;
    }

    await updateDeliveryAction.execute(selectedOrder.id, nextDeliveryStatus);
    setSelectedOrder(undefined);
    await orders.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Orders" description="Order oversight with payment, fulfillment, and revenue visibility." />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Orders</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{summary.totalOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paid Revenue</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(summary.paidRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending Delivery</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{summary.pendingDelivery}</p>
        </div>
      </section>

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search order id or buyer"
        filters={
          <>
            <Select
              value={query.paymentStatus ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, paymentStatus: event.target.value as OrderQuery["paymentStatus"] }))}
              className="w-full sm:w-[170px]"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </Select>
            <Select
              value={query.deliveryStatus ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, deliveryStatus: event.target.value as OrderQuery["deliveryStatus"] }))}
              className="w-full sm:w-[170px]"
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
        <LoadingState rows={7} />
      ) : orders.data.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No orders found" message="No orders match your search criteria." />
      ) : (
        <DataTable headers={["Order", "Buyer", "Products", "Total", "Payment", "Delivery", "Created", "Action"]}>
          {orders.data.map((order) => (
            <tr key={order.id} className="hover:bg-surface-soft/60">
              <td className="px-4 py-3 text-sm font-semibold text-foreground">{order.id}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{order.buyerName}</td>
              <td className="px-4 py-3 text-sm text-foreground">{order.productCount}</td>
              <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(order.total)}</td>
              <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
              <td className="px-4 py-3"><StatusBadge status={order.deliveryStatus} /></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
              <td className="px-4 py-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    setNextDeliveryStatus(order.deliveryStatus);
                  }}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {selectedOrder ? (
        <Modal
          open={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(undefined)}
          title={`Order ${selectedOrder.id}`}
          description={`Buyer: ${selectedOrder.buyerName}`}
          className="max-w-2xl"
        >
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Total</p>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(selectedOrder.total)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Payment</p>
                <StatusBadge status={selectedOrder.paymentStatus} />
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground">Delivery</p>
                <StatusBadge status={selectedOrder.deliveryStatus} />
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Lines</p>
              <div className="space-y-2">
                {selectedOrder.lines.map((line, index) => (
                  <div key={`${line.productName}_${index}`} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{line.productName}</span>
                    <span className="text-muted-foreground">{line.quantity} × {formatCurrency(line.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Select value={nextDeliveryStatus} onChange={(event) => setNextDeliveryStatus(event.target.value as Order["deliveryStatus"])}>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
              </Select>
              <Button onClick={() => void handleUpdateDelivery()} loading={updateDeliveryAction.loading}>Update Status</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
