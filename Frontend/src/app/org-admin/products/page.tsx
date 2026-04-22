"use client";

import { Boxes, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateProductDialog } from "@/components/org-admin/create-product-dialog";
import { SegmentedControl } from "@/components/org-admin/segmented-control";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatCurrency } from "@/lib/utils";
import { type Product, type ProductQuery } from "@/types/org-admin";

export default function ProductsPage() {
  const [query, setQuery] = useState<ProductQuery>({ search: "", category: "ALL", status: "ALL" });
  const [view, setView] = useState<"TABLE" | "GRID">("TABLE");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  const products = useAsyncResource(() => orgAdminService.getProducts(query), [query.search, query.category, query.status]);
  const createAction = useAsyncAction((payload: Parameters<typeof orgAdminService.createProduct>[0]) =>
    orgAdminService.createProduct(payload),
  );
  const toggleStatusAction = useAsyncAction((productId: string) => orgAdminService.toggleProductStatus(productId));

  const activeProducts = useMemo(
    () => products.data?.filter((product) => product.status === "ACTIVE").length ?? 0,
    [products.data],
  );

  const handleCreate = async (payload: Parameters<typeof orgAdminService.createProduct>[0]) => {
    await createAction.execute(payload);
    setCreateOpen(false);
    await products.reload();
  };

  const handleToggleStatus = async () => {
    if (!selectedProduct) {
      return;
    }

    await toggleStatusAction.execute(selectedProduct.id);
    setSelectedProduct(undefined);
    await products.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description="Manage product catalog, pricing, stock posture, and activation state."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        }
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search product name or category"
        filters={
          <>
            <Select
              value={query.category ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, category: event.target.value as ProductQuery["category"] }))}
              className="w-full sm:w-[170px]"
            >
              <option value="ALL">All Categories</option>
              <option value="LARVAE">Larvae</option>
              <option value="FERTILIZER">Fertilizer</option>
              <option value="PLASTIC_BRICKS">Plastic Bricks</option>
              <option value="GARDEN_STAKES">Garden Stakes</option>
              <option value="OTHER">Other</option>
            </Select>

            <Select
              value={query.status ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, status: event.target.value as ProductQuery["status"] }))}
              className="w-full sm:w-[150px]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
            </Select>

            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { label: "Table", value: "TABLE" },
                { label: "Grid", value: "GRID" },
              ]}
            />
          </>
        }
      />

      {products.error ? <ErrorState message={products.error} onRetry={() => void products.reload()} /> : null}

      {products.loading || !products.data ? (
        <LoadingState rows={7} />
      ) : products.data.length === 0 ? (
        <EmptyState icon={Boxes} title="No products found" message="Try updating filters or create a new product." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Products</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{products.data.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Products</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{activeProducts}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catalog Value (Est.)</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {formatCurrency(products.data.reduce((sum, item) => sum + item.price * item.stockAvailable, 0))}
              </p>
            </div>
          </div>

          {view === "TABLE" ? (
            <DataTable headers={["Product", "Category", "Unit", "Price", "Stock", "Status", "Actions"]}>
              {products.data.map((product) => (
                <tr key={product.id} className="hover:bg-surface-soft/60">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.description ?? "No description"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{product.category.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{product.unit}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{product.stockAvailable}</td>
                  <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedProduct(product)}>
                      {product.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.data.map((product) => (
                <div key={product.id} className="rounded-xl border border-border bg-white p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{product.category.replaceAll("_", " ")}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-surface-soft p-2">
                      <p className="text-[11px] text-muted-foreground">Price</p>
                      <p className="font-semibold text-foreground">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="rounded-md bg-surface-soft p-2">
                      <p className="text-[11px] text-muted-foreground">Stock</p>
                      <p className="font-semibold text-foreground">{product.stockAvailable} {product.unit}</p>
                    </div>
                  </div>
                  <Button className="mt-3 w-full" variant="secondary" onClick={() => setSelectedProduct(product)}>
                    {product.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {createOpen ? (
        <CreateProductDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} loading={createAction.loading} />
      ) : null}

      <ConfirmDialog
        open={Boolean(selectedProduct)}
        title={selectedProduct?.status === "ACTIVE" ? "Deactivate product?" : "Activate product?"}
        message={selectedProduct?.status === "ACTIVE" ? "This product will no longer be available for new orders." : "This product will become available for operations."}
        confirmLabel={selectedProduct?.status === "ACTIVE" ? "Deactivate" : "Activate"}
        onClose={() => setSelectedProduct(undefined)}
        onConfirm={handleToggleStatus}
        loading={toggleStatusAction.loading}
        danger={selectedProduct?.status === "ACTIVE"}
      />
    </div>
  );
}
