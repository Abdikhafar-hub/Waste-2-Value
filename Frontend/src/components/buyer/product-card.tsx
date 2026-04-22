import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AvailabilityBadge } from "@/components/buyer/availability-badge";
import { formatCurrency } from "@/lib/utils";
import { type BuyerProduct } from "@/types/buyer";

export function ProductCard({ product }: { product: BuyerProduct }) {
  return (
    <article className="rounded-xl border border-border bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-premium">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.producerOrganization}</p>
        </div>
        <AvailabilityBadge availability={product.availability} />
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-border bg-surface-soft px-2 py-1.5">
          <p className="text-muted-foreground">Category</p>
          <p className="font-semibold text-foreground">{product.category.replaceAll("_", " ")}</p>
        </div>
        <div className="rounded-md border border-border bg-surface-soft px-2 py-1.5">
          <p className="text-muted-foreground">Unit</p>
          <p className="font-semibold text-foreground">{product.unit}</p>
        </div>
        <div className="rounded-md border border-border bg-surface-soft px-2 py-1.5">
          <p className="text-muted-foreground">Price</p>
          <p className="font-semibold text-foreground">{formatCurrency(product.price)}</p>
        </div>
        <div className="rounded-md border border-border bg-surface-soft px-2 py-1.5">
          <p className="text-muted-foreground">Available</p>
          <p className="font-semibold text-foreground">{product.availableQuantity}</p>
        </div>
      </div>

      <Link
        href={`/buyer/marketplace/${product.id}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand"
      >
        View details <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
