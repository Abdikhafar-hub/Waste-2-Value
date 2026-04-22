"use client";

import { Store } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/buyer/product-card";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { Select } from "@/components/ui/select";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { buyerService } from "@/lib/services/buyer-service";
import { type BuyerMarketplaceQuery } from "@/types/buyer";

export default function BuyerMarketplacePage() {
  const [query, setQuery] = useState<BuyerMarketplaceQuery>({
    search: "",
    category: "ALL",
    availability: "ALL",
    maxPrice: "ALL",
  });

  const meta = useAsyncResource(() => buyerService.getMarketplaceFilterMeta(), []);
  const products = useAsyncResource(
    () => buyerService.getMarketplaceProducts(query),
    [query.search, query.category, query.availability, query.maxPrice],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Marketplace"
        description="Browse available recycled output products and place trusted B2B orders."
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search by product, category, or producer"
        filters={
          <>
            <Select
              value={query.category ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, category: event.target.value as BuyerMarketplaceQuery["category"] }))}
              className="w-[190px]"
            >
              <option value="ALL">All Categories</option>
              {(meta.data?.categories ?? []).map((category) => (
                <option key={category} value={category}>{category.replaceAll("_", " ")}</option>
              ))}
            </Select>

            <Select
              value={query.availability ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, availability: event.target.value as BuyerMarketplaceQuery["availability"] }))}
              className="w-[170px]"
            >
              <option value="ALL">Any Availability</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </Select>

            <Select
              value={String(query.maxPrice ?? "ALL")}
              onChange={(event) =>
                setQuery((prev) => ({
                  ...prev,
                  maxPrice: event.target.value === "ALL" ? "ALL" : Number(event.target.value),
                }))
              }
              className="w-[170px]"
            >
              <option value="ALL">Any Price</option>
              <option value="100">Up to 100 KES</option>
              <option value="500">Up to 500 KES</option>
              <option value="1000">Up to 1,000 KES</option>
            </Select>
          </>
        }
      />

      {products.error ? <ErrorState message={products.error} onRetry={() => void products.reload()} /> : null}

      {products.loading || !products.data ? (
        <LoadingState rows={8} />
      ) : products.data.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No products match this filter"
          message="Adjust search and filter settings to discover available marketplace products."
        />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}
