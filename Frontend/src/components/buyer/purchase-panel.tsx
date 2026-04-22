"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AvailabilityBadge } from "@/components/buyer/availability-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { type BuyerProduct } from "@/types/buyer";

interface PurchasePanelProps {
  product: BuyerProduct;
  loading?: boolean;
  onSubmit: (payload: { quantity: number; notes?: string }) => Promise<void>;
}

export function PurchasePanel({ product, loading, onSubmit }: PurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disabled = product.availability === "OUT_OF_STOCK" || product.availableQuantity <= 0;

  const total = useMemo(() => quantity * product.price, [quantity, product.price]);

  const increment = () => {
    setQuantity((prev) => Math.min(product.availableQuantity, prev + 1));
  };

  const decrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (quantity > product.availableQuantity) {
      setError("Quantity exceeds available stock.");
      return;
    }

    setError(null);
    await onSubmit({ quantity, notes: notes.trim() || undefined });
  };

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Place Order</p>
        <AvailabilityBadge availability={product.availability} />
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <p>Unit Price: <span className="font-semibold text-foreground">{formatCurrency(product.price)}</span></p>
        <p>Available Stock: <span className="font-semibold text-foreground">{product.availableQuantity} {product.unit}</span></p>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</label>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={decrement} disabled={quantity <= 1 || disabled}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            max={Math.max(1, product.availableQuantity)}
            value={String(quantity)}
            onChange={(event) => setQuantity(Number(event.target.value))}
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={increment}
            disabled={quantity >= product.availableQuantity || disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes (optional)</label>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Delivery instructions"
          disabled={disabled}
        />
      </div>

      <div className="mt-3 rounded-lg border border-border bg-surface-soft p-3">
        <p className="text-xs text-muted-foreground">Estimated Total</p>
        <p className="text-xl font-semibold text-foreground">{formatCurrency(total)}</p>
      </div>

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <Button
        className="mt-3 w-full"
        onClick={() => void handleSubmit()}
        loading={loading}
        disabled={disabled}
      >
        Place Order
      </Button>

      {disabled ? (
        <p className="mt-2 text-xs text-muted-foreground">This product is currently unavailable for ordering.</p>
      ) : null}
    </div>
  );
}
