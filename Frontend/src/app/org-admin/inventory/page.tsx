"use client";

import { Boxes } from "lucide-react";
import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/org-admin/segmented-control";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { SectionCard } from "@/components/platform/section-card";
import { StatBlock } from "@/components/platform/stat-block";
import { StatusBadge } from "@/components/platform/status-badge";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function InventoryPage() {
  const [tab, setTab] = useState<"STOCK" | "LOTS" | "MOVEMENTS">("STOCK");
  const [search, setSearch] = useState("");

  const inventory = useAsyncResource(() => orgAdminService.getInventoryOverview(), []);

  const filtered = useMemo(() => {
    if (!inventory.data) {
      return { stock: [], lots: [], movements: [] };
    }

    const query = search.trim().toLowerCase();

    return {
      stock: inventory.data.stock.filter((item) => !query || item.name.toLowerCase().includes(query)),
      lots: inventory.data.lots.filter(
        (item) => !query || item.productName.toLowerCase().includes(query) || item.lotCode.toLowerCase().includes(query),
      ),
      movements: inventory.data.movements.filter(
        (item) => !query || item.productName.toLowerCase().includes(query) || item.reason.toLowerCase().includes(query),
      ),
    };
  }, [inventory.data, search]);

  return (
    <div className="space-y-4">
      <PageHeader title="Inventory" description="Track stock health, lot-level exposure, and movement history." />

      {inventory.error ? <ErrorState message={inventory.error} onRetry={() => void inventory.reload()} /> : null}

      {inventory.loading || !inventory.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatBlock label="Total Stock Units" value={String(inventory.data.summary.totalStockUnits)} />
            <StatBlock label="Low Stock Lots" value={String(inventory.data.summary.lowStockLots)} />
            <StatBlock label="Risk Lots" value={String(inventory.data.summary.riskLots)} />
            <StatBlock label="Stock Value" value={formatCurrency(inventory.data.summary.stockValue)} />
          </section>

          <SearchFilterToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search stock, lots, or movements"
            filters={
              <SegmentedControl
                value={tab}
                onChange={setTab}
                options={[
                  { label: "Stock Overview", value: "STOCK" },
                  { label: "Lots", value: "LOTS" },
                  { label: "Movements", value: "MOVEMENTS" },
                ]}
              />
            }
          />

          <SectionCard title={tab === "STOCK" ? "Stock Overview" : tab === "LOTS" ? "Inventory Lots" : "Recent Movements"} compact>
            {tab === "STOCK" ? (
              filtered.stock.length === 0 ? (
                <EmptyState icon={Boxes} title="No stock found" message="No products match your search." />
              ) : (
                <DataTable headers={["Product", "Category", "Stock", "Unit", "Price", "Status"]}>
                  {filtered.stock.map((product) => (
                    <tr key={product.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{product.category.replaceAll("_", " ")}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{product.stockAvailable}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{product.unit}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                    </tr>
                  ))}
                </DataTable>
              )
            ) : null}

            {tab === "LOTS" ? (
              filtered.lots.length === 0 ? (
                <EmptyState icon={Boxes} title="No lots found" message="No inventory lots match your search." />
              ) : (
                <DataTable headers={["Lot", "Product", "Qty", "Location", "Expiry", "Status"]}>
                  {filtered.lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{lot.lotCode}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{lot.productName}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{lot.quantity} {lot.unit}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{lot.location}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{lot.expiresAt ? formatDateTime(lot.expiresAt) : "-"}</td>
                      <td className="px-4 py-3"><StatusBadge status={lot.status} /></td>
                    </tr>
                  ))}
                </DataTable>
              )
            ) : null}

            {tab === "MOVEMENTS" ? (
              filtered.movements.length === 0 ? (
                <EmptyState icon={Boxes} title="No movements found" message="No inventory movements match your search." />
              ) : (
                <DataTable headers={["Product", "Lot", "Type", "Quantity", "Reason", "Actor", "When"]}>
                  {filtered.movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{movement.productName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{movement.lotCode}</td>
                      <td className="px-4 py-3"><StatusBadge status={movement.type} /></td>
                      <td className="px-4 py-3 text-sm text-foreground">{movement.quantity} {movement.unit}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{movement.reason}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{movement.actor}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</td>
                    </tr>
                  ))}
                </DataTable>
              )
            ) : null}
          </SectionCard>
        </>
      )}
    </div>
  );
}
